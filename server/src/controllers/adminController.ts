import { Request, Response } from 'express';
import CommunicationSession from '../models/CommunicationSession';
import GDSession from '../models/GDSession';
import BodyLanguageSession from '../models/BodyLanguageSession';
import MockInterviewSession from '../models/MockInterviewSession';
import PlacementPrediction from '../models/PlacementPrediction';

export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    // Count all session documents across modules
    const commCount = await CommunicationSession.countDocuments();
    const gdCount = await GDSession.countDocuments();
    const bodyCount = await BodyLanguageSession.countDocuments();
    const interviewCount = await MockInterviewSession.countDocuments();
    const predictionCount = await PlacementPrediction.countDocuments();

    const totalAssessments = commCount + gdCount + bodyCount + interviewCount + predictionCount;
    const activeSessions = Math.round(totalAssessments * 0.15) || 12; // Mock live active sessions

    // Fetch the latest placement predictions to populate the student table
    const recentPredictions = await PlacementPrediction.find().sort({ createdAt: -1 }).limit(10);
    
    let studentManagement = recentPredictions.map((pred, i) => {
      // Find the highest matched company
      const topCompany = pred.companyWise.reduce((prev, current) => 
        (prev.matchPercentage > current.matchPercentage) ? prev : current
      );

      // Create a mocked student profile name based on index, as we don't have a real User schema in this context
      const names = ["Shreya Jaiswal", "Rahul Verma", "Rohit Sharma", "Nisha Gupta", "Arjun Reddy", "Priya Singh"];
      const name = names[i % names.length];
      const email = `${name.split(' ')[0].toLowerCase()}@uni.edu`;

      let status = "Needs Improvement";
      if (pred.readinessOverall >= 85) status = `Placed (${topCompany.name})`;
      else if (pred.readinessOverall >= 75) status = `Ready (${topCompany.name})`;
      else if (pred.readinessOverall >= 60) status = "Interview Scheduled";

      return {
        name,
        email,
        readiness: `${pred.readinessOverall}%`,
        status
      };
    });

    // If there are no predictions yet, fallback to mock data
    if (studentManagement.length === 0) {
      studentManagement = [
        { name: 'Shreya Jaiswal', email: 'shreya.j@uni.edu', readiness: '92%', status: 'Placed (Accenture)' },
        { name: 'Rahul Verma', email: 'rahul.v@uni.edu', readiness: '85%', status: 'Ready (Wipro)' },
        { name: 'Rohit Sharma', email: 'rohit.s@uni.edu', readiness: '78%', status: 'Interview Scheduled' },
        { name: 'Nisha Gupta', email: 'nisha.g@uni.edu', readiness: '64%', status: 'Needs Improvement' }
      ];
    }

    res.status(200).json({
      totalAssessments: totalAssessments > 0 ? totalAssessments : 52430, // Fallback if DB is completely empty
      activeSessions,
      totalUsers: 14890, // Hardcoded global metric
      monthlyRevenue: "$12,890", // Hardcoded global metric
      studentManagement
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
};
