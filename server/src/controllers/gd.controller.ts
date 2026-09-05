import { Request, Response } from 'express';
import GDRequest from '../models/GDRequest';
import GDTopic from '../models/GDTopic';

// ─── Submit a Live GD Request ─────────────────────────────────────────────────
export const submitGDRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { preferredDate, preferredTime, topic, communicationMode, numberOfParticipants, availabilitySlot, notes } = req.body;

    if (!preferredDate || !preferredTime || !topic || !communicationMode || !numberOfParticipants || !availabilitySlot) {
      res.status(400).json({ error: 'All required fields must be filled.' });
      return;
    }

    const gdRequest = await GDRequest.create({
      userId: user.id,
      userName: user.name || user.email,
      userEmail: user.email,
      preferredDate: new Date(preferredDate),
      preferredTime,
      topic,
      communicationMode,
      numberOfParticipants,
      availabilitySlot,
      notes,
      status: 'pending',
    });

    res.status(201).json({ message: 'Your GD request has been submitted successfully.', request: gdRequest });
  } catch (error) {
    console.error('Submit GD request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Get User's Own Requests ──────────────────────────────────────────────────
export const getUserGDRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const requests = await GDRequest.find({ userId: user.id }).sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (error) {
    console.error('Get user GD requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Get Dynamic GD Topics ────────────────────────────────────────────────────
export const getGDTopics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const filter: any = { isActive: true };
    if (category) filter.category = category;

    let topics = await GDTopic.find(filter).sort({ addedDate: -1 });

    // If DB has no topics yet, seed and return defaults
    if (topics.length === 0) {
      const seedTopics = [
        { title: 'Impact of Generative AI on Campus Placements', category: 'Artificial Intelligence' },
        { title: 'Should India ban single-use plastics by 2025?', category: 'Environment' },
        { title: "India's G20 Presidency: Achievements and Global Impact", category: 'International Affairs' },
        { title: 'Rise of Startups in Tier 2 Cities of India', category: 'Startups' },
        { title: 'Is Remote Work the Future of Indian IT Sector?', category: 'Technology' },
        { title: 'NEP 2020: Transforming Indian Education', category: 'Education' },
        { title: 'Digital Rupee vs UPI: Which is the Future?', category: 'Economy' },
        { title: "Women's Safety in India: Are Laws Enough?", category: 'Social Issues' },
        { title: 'Chandrayaan-3 and the Future of ISRO', category: 'Current Affairs' },
        { title: 'IPL Impact on Indian Cricket Development', category: 'Sports' },
        { title: 'AI in Healthcare: Boon or Bane?', category: 'Healthcare' },
        { title: 'Inflation vs Economic Growth: Indian Dilemma', category: 'Business' },
      ];
      topics = await GDTopic.insertMany(seedTopics) as any;
    }

    res.status(200).json({ topics });
  } catch (error) {
    console.error('Get GD topics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Complete GD Session + Save AI Evaluation Report ─────────────────────────
export const completeGDRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { evaluationReport } = req.body;

    const gdRequest = await GDRequest.findById(id);
    if (!gdRequest) {
      res.status(404).json({ error: 'GD Request not found.' });
      return;
    }

    // Only the owning user can mark it complete
    if (gdRequest.userId.toString() !== user.id.toString()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    gdRequest.status = 'completed';
    if (evaluationReport) {
      gdRequest.evaluationReport = evaluationReport;
    }
    await gdRequest.save();

    res.status(200).json({ message: 'GD session marked as completed.', request: gdRequest });
  } catch (error) {
    console.error('Complete GD request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Get Single GD Request by ID ─────────────────────────────────────────────
export const getGDRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const gdRequest = await GDRequest.findById(id);
    if (!gdRequest) {
      res.status(404).json({ error: 'GD Request not found.' });
      return;
    }

    if (gdRequest.userId.toString() !== user.id.toString()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.status(200).json({ request: gdRequest });
  } catch (error) {
    console.error('Get GD request by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
