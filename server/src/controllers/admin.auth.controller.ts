import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin';
import GDRequest from '../models/GDRequest';
import { User } from '../models/User';
import { emailService } from '../services/email.service';
import { getIO } from '../socket';
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'admin_fallback_secret';

// ─── Admin Login ────────────────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId, password } = req.body;
    if (!adminId || !password) {
      res.status(400).json({ error: 'Admin ID and password are required.' });
      return;
    }

    // Accept login by adminId OR email for flexibility
    const admin = await Admin.findOne({
      $or: [
        { adminId: adminId.trim() },
        { email: adminId.toLowerCase().trim() },
      ],
      isActive: true,
    });

    if (!admin) {
      res.status(401).json({ error: 'Invalid Admin ID or Password.' });
      return;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid Admin ID or Password.' });
      return;
    }

    const token = jwt.sign(
      { id: admin._id, adminId: admin.adminId, email: admin.email, name: admin.name, role: admin.role, isAdmin: true },
      JWT_ADMIN_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      token,
      admin: { id: admin._id, adminId: admin.adminId, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// ─── Admin Dashboard Stats ────────────────────────────────────────────────────
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, pendingRequests, approvedRequests, rejectedRequests, completedSessions] = await Promise.all([
      User.countDocuments(),
      GDRequest.countDocuments({ status: 'pending' }),
      GDRequest.countDocuments({ status: 'approved' }),
      GDRequest.countDocuments({ status: 'rejected' }),
      GDRequest.countDocuments({ status: 'completed' }),
    ]);

    const upcomingSessions = await GDRequest.find({ status: 'approved' })
      .sort({ assignedDate: 1 })
      .limit(10)
      .select('userName userEmail assignedDate assignedTime assignedTopic assignedMode');

    const requestedTopics = await GDRequest.aggregate([
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const preferredTimes = await GDRequest.aggregate([
      { $group: { _id: '$availabilitySlot', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      totalUsers,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      completedSessions,
      upcomingSessions,
      requestedTopics,
      preferredTimes,
      // Legacy fields for backward compatibility
      totalAssessments: completedSessions * 3,
      activeSessions: approvedRequests,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── List All GD Requests ─────────────────────────────────────────────────────
export const listGDRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const requests = await GDRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await GDRequest.countDocuments(filter);

    res.status(200).json({ requests, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('List GD requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Approve GD Request ───────────────────────────────────────────────────────
export const approveGDRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).admin;
    const { assignedDate, assignedTime, assignedTopic, assignedParticipantCount, assignedMode, meetingLink, adminNotes } = req.body;

    const gdRequest = await GDRequest.findById(id);
    if (!gdRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Generate a unique session ID
    const sessionId = new mongoose.Types.ObjectId();

    gdRequest.status = 'approved';
    gdRequest.sessionId = sessionId;
    gdRequest.assignedDate = assignedDate ? new Date(assignedDate) : gdRequest.preferredDate;
    gdRequest.assignedTime = assignedTime || gdRequest.preferredTime;
    gdRequest.assignedTopic = assignedTopic || gdRequest.topic;
    gdRequest.assignedParticipantCount = assignedParticipantCount || gdRequest.numberOfParticipants;
    gdRequest.assignedMode = assignedMode || gdRequest.communicationMode;
    gdRequest.meetingLink = meetingLink || `${process.env.CLIENT_URL || 'http://localhost:5173'}/live-gd/${gdRequest._id}`;
    gdRequest.adminNotes = adminNotes;
    (gdRequest as any).approvedBy = adminUser?.adminId || 'admin';
    (gdRequest as any).approvedAt = new Date();

    await gdRequest.save();

    // ── Real-time push to student via Socket.IO ───────────────────────────────
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${gdRequest.userId.toString()}`).emit('gd_request_updated', {
          requestId: gdRequest._id,
          status: 'approved',
          sessionId: sessionId.toString(),
          assignedDate: gdRequest.assignedDate,
          assignedTime: gdRequest.assignedTime,
          assignedTopic: gdRequest.assignedTopic,
          assignedMode: gdRequest.assignedMode,
          assignedParticipantCount: gdRequest.assignedParticipantCount,
          meetingLink: gdRequest.meetingLink,
        });
        console.log(`[Socket.IO] Emitted gd_request_updated to user_${gdRequest.userId}`);
      }
    } catch (socketErr) {
      console.warn('[Socket.IO] Could not emit gd_request_updated:', socketErr);
    }

    // ── Send approval email (non-blocking — failure never breaks approval) ────
    const user = await User.findById(gdRequest.userId);
    if (user) {
      const dateLabel = gdRequest.assignedDate
        ? gdRequest.assignedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : gdRequest.preferredDate.toLocaleDateString('en-IN');
      const timeLabel = gdRequest.assignedTime || gdRequest.preferredTime;
      const link = gdRequest.meetingLink || `${process.env.CLIENT_URL || 'http://localhost:5173'}/live-gd/${gdRequest._id}`;

      emailService.sendGDApprovalEmail(
        user.email,
        user.name,
        gdRequest.assignedTopic || gdRequest.topic,
        dateLabel,
        timeLabel,
        link
      ).then(() => {
        console.log(`[Admin] Approval email sent to ${user.email}`);
      }).catch((err: Error) => {
        console.error(`[Admin] Approval email failed (non-fatal): ${err.message}`);
      });
    }

    res.status(200).json({ message: 'Request approved successfully', request: gdRequest });
  } catch (error) {
    console.error('Approve GD request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Reject GD Request ────────────────────────────────────────────────────────
export const rejectGDRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const gdRequest = await GDRequest.findById(id);
    if (!gdRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    gdRequest.status = 'rejected';
    gdRequest.rejectionReason = rejectionReason || 'No slots available for the requested time.';
    await gdRequest.save();

    // Fetch user details to send rejection email
    const user = await User.findById(gdRequest.userId);
    if (user) {
      await emailService.sendGDRejectionEmail(
        user.email,
        user.name,
        gdRequest.topic,
        gdRequest.rejectionReason || 'No slots available for the requested time.'
      );
    }

    res.status(200).json({ message: 'Request rejected', request: gdRequest });
  } catch (error) {
    console.error('Reject GD request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── List All Users ────────────────────────────────────────────────────────────
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Reschedule GD Request ────────────────────────────────────────────────────
export const rescheduleGDRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedDate, assignedTime, assignedTopic, assignedMode, assignedParticipantCount, adminNotes } = req.body;

    const gdRequest = await GDRequest.findById(id);
    if (!gdRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    gdRequest.status = 'approved';
    if (assignedDate) gdRequest.assignedDate = new Date(assignedDate);
    if (assignedTime) gdRequest.assignedTime = assignedTime;
    if (assignedTopic) gdRequest.assignedTopic = assignedTopic;
    if (assignedMode) gdRequest.assignedMode = assignedMode;
    if (assignedParticipantCount) gdRequest.assignedParticipantCount = assignedParticipantCount;
    gdRequest.adminNotes = adminNotes || 'Rescheduled by admin.';
    gdRequest.meetingLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/live-gd/${gdRequest._id}`;

    await gdRequest.save();

    // ── Real-time push to student ─────────────────────────────────────────────
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${gdRequest.userId.toString()}`).emit('gd_request_updated', {
          requestId: gdRequest._id,
          status: 'approved',
          assignedDate: gdRequest.assignedDate,
          assignedTime: gdRequest.assignedTime,
          assignedTopic: gdRequest.assignedTopic,
          assignedMode: gdRequest.assignedMode,
          assignedParticipantCount: gdRequest.assignedParticipantCount,
          meetingLink: gdRequest.meetingLink,
        });
      }
    } catch (socketErr) {
      console.warn('[Socket.IO] Could not emit gd_request_updated:', socketErr);
    }

    // ── Send updated schedule email (non-blocking) ────────────────────────────
    const user = await User.findById(gdRequest.userId);
    if (user) {
      const dateLabel = gdRequest.assignedDate
        ? gdRequest.assignedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : gdRequest.preferredDate.toLocaleDateString('en-IN');
      const link = gdRequest.meetingLink || `${process.env.CLIENT_URL || 'http://localhost:5173'}/live-gd/${gdRequest._id}`;

      emailService.sendGDApprovalEmail(
        user.email,
        user.name,
        gdRequest.assignedTopic || gdRequest.topic,
        dateLabel,
        gdRequest.assignedTime || gdRequest.preferredTime,
        link
      ).then(() => {
        console.log(`[Admin] Reschedule email sent to ${user.email}`);
      }).catch((err: Error) => {
        console.error(`[Admin] Reschedule email failed (non-fatal): ${err.message}`);
      });
    }

    res.status(200).json({ message: 'Request rescheduled successfully', request: gdRequest });
  } catch (error) {
    console.error('Reschedule GD request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

