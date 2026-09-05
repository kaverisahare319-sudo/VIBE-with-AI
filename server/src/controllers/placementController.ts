import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PlacementPrediction from '../models/PlacementPrediction';
import CommunicationSession from '../models/CommunicationSession';
import GDSession from '../models/GDSession';
import BodyLanguageSession from '../models/BodyLanguageSession';

import OpenAI from 'openai';
import AIPlacementAssessment from '../models/AIPlacementAssessment';
import CodingSubmission from '../models/CodingSubmission';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

// Real-time AI Placement Prediction Engine
export const generatePrediction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId || 'student-1';

    // 1. Fetch real historical data for the user
    let placementSessions: any[] = [];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      placementSessions = await AIPlacementAssessment.find({ user: userId }).sort({ completedAt: -1 }).limit(5);
    }
    const codingSessions = await CodingSubmission.find({ userId }).sort({ createdAt: -1 }).limit(10);
    const commSessions = await CommunicationSession.find({ userId }).sort({ createdAt: -1 }).limit(5);
    const gdSessions = await GDSession.find({ userId }).sort({ createdAt: -1 }).limit(5);

    // 2. Strict Data Completeness Check
    if (placementSessions.length === 0 || codingSessions.length === 0 || gdSessions.length === 0) {
      return res.status(200).json({ 
        status: 'no_data', 
        message: 'Not enough assessment data. Complete Mock Interview, Coding Test, and Group Discussion to generate company-specific placement predictions.' 
      });
    }

    // 3. Aggregate precise metrics
    const avgTech = placementSessions.reduce((acc, curr) => acc + (curr.scores?.technical || 0), 0) / placementSessions.length;
    const avgMock = placementSessions.reduce((acc, curr) => acc + (curr.scores?.overallEmployability || 0), 0) / placementSessions.length;
    const avgConf = placementSessions.reduce((acc, curr) => acc + (curr.scores?.confidence || 0), 0) / placementSessions.length;
    const avgCoding = codingSessions.reduce((acc, curr) => acc + ((curr.score / (curr.maxScore || 1)) * 100), 0) / codingSessions.length;
    const avgComm = commSessions.length > 0 ? commSessions.reduce((acc, curr) => acc + curr.communicationScore, 0) / commSessions.length : 70;
    const avgGD = gdSessions.reduce((acc, curr) => acc + curr.overallScore, 0) / gdSessions.length;
    const resumeScore = 85; // Simulated until dedicated Resume ATS model is active

    // 4. Calculate Readiness Formula
    // Technical 30%, Coding 25%, Communication 15%, Group Discussion 10%, Mock Interview 10%, Resume 5%, Confidence 5%
    const readinessOverall = Math.round(
      (avgTech * 0.30) +
      (avgCoding * 0.25) +
      (avgComm * 0.15) +
      (avgGD * 0.10) +
      (avgMock * 0.10) +
      (resumeScore * 0.05) +
      (avgConf * 0.05)
    );

    const interviewReadiness = Math.round((avgMock * 0.4) + (avgComm * 0.4) + (avgGD * 0.2));
    const communicationReadiness = Math.round((avgComm * 0.5) + (avgGD * 0.5));
    const technicalReadiness = Math.round((avgTech * 0.5) + (avgCoding * 0.5));

    // 5. Generate AI Analysis for Companies, Gaps, and Roadmap
    const prompt = `You are a Placement Prediction AI.
Based on the candidate's actual performance metrics, calculate dynamic company match percentages, specific skill gaps, and a personalized roadmap.

Candidate Metrics:
Technical: ${avgTech.toFixed(1)}
Coding (DSA): ${avgCoding.toFixed(1)}
Communication: ${avgComm.toFixed(1)}
Group Discussion: ${avgGD.toFixed(1)}
Mock Interview: ${avgMock.toFixed(1)}
Overall Readiness: ${readinessOverall}

Company Requirements Database (For reference to match against):
- Google: Advanced DSA, System Design, OOP, Communication, Problem Solving.
- Microsoft: DSA, OOP, SQL, Cloud Basics, Communication.
- Amazon: Leadership Principles, DSA, OOP, Behavioral.
- Infosys: Aptitude, Basic Programming, Communication.
- TCS: Aptitude, Coding Basics, Verbal Ability.
- Accenture: Coding, Communication, Problem Solving.
- Deloitte: Communication, SQL, Aptitude, Analytical Thinking.

Calculate a realistic match percentage (0-100) for at least 5 of these companies based strictly on the metrics. 
Status must be one of: "Ready", "Almost Ready", "Needs Improvement", "Not Eligible Yet".
Generate 3-4 specific skill gaps (e.g., if Coding is low, mention specific DSA topics).
Generate 3-4 personalized roadmap steps (e.g., if Comm is low, give specific speaking exercises).

Return ONLY a JSON object matching this structure:
{
  "companyWise": [
    { "name": "Company Name", "matchPercentage": 85, "status": "Ready" }
  ],
  "skillGaps": ["string", "string"],
  "roadmap": ["string", "string"]
}`;

    let companyWise = [];
    let skillGaps = [];
    let roadmap = [];

    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key') {
        const payload = {
          model: "gpt-4o-mini",
          messages: [{ role: "user" as const, content: prompt }],
          response_format: { type: "json_object" as const },
          temperature: 0.3
        };
        const completion = await openai.chat.completions.create(payload as any);
        const resultText = completion.choices[0].message.content || '{}';
        const analysis = JSON.parse(resultText);
        
        companyWise = analysis.companyWise || [];
        skillGaps = analysis.skillGaps || [];
        roadmap = analysis.roadmap || [];
      } else {
        throw new Error("No OpenAI Key"); // Trigger fallback
      }
    } catch (aiError) {
      // Robust Smart Mock Fallback based on real scores
      const clamp = (val: number) => Math.max(10, Math.min(99, Math.round(val)));
      
      companyWise = [
        { name: 'Google', matchPercentage: clamp((avgTech * 0.4) + (avgCoding * 0.5) + (avgComm * 0.1)), status: '' },
        { name: 'Microsoft', matchPercentage: clamp((avgTech * 0.4) + (avgCoding * 0.4) + (avgComm * 0.2)), status: '' },
        { name: 'Amazon', matchPercentage: clamp((avgCoding * 0.4) + (avgMock * 0.4) + (avgComm * 0.2)), status: '' },
        { name: 'Infosys', matchPercentage: clamp((avgTech * 0.3) + (avgCoding * 0.3) + (avgComm * 0.4) + 15), status: '' },
        { name: 'TCS', matchPercentage: clamp((avgTech * 0.3) + (avgCoding * 0.2) + (avgComm * 0.5) + 15), status: '' },
        { name: 'Deloitte', matchPercentage: clamp((avgComm * 0.5) + (avgGD * 0.3) + (avgMock * 0.2) + 10), status: '' }
      ].map(c => {
        if (c.matchPercentage >= 85) c.status = 'Ready';
        else if (c.matchPercentage >= 70) c.status = 'Almost Ready';
        else if (c.matchPercentage >= 50) c.status = 'Needs Improvement';
        else c.status = 'Not Eligible Yet';
        return c;
      });

      if (avgComm < 60) {
        skillGaps.push("Verbal communication fluency");
        roadmap.push("Practice speaking on random topics for 20 minutes daily and reduce filler words.");
      } else if (avgComm < 80) {
        skillGaps.push("Structured communication");
        roadmap.push("Use the STAR method to structure your behavioral answers more clearly.");
      }

      if (avgCoding < 50) {
        skillGaps.push("Basic Data Structures");
        roadmap.push("Focus on Arrays, Linked Lists, and Strings. Solve at least 50 basic problems.");
      } else if (avgCoding < 75) {
        skillGaps.push("Advanced problem solving");
        roadmap.push("Practice Trees, Graphs, and Dynamic Programming problems.");
      }

      if (avgGD < 65) {
        skillGaps.push("Group Discussion Leadership");
        roadmap.push("Take initiative to start GDs and practice acknowledging others' points before adding your own.");
      }

      if (skillGaps.length === 0) {
        skillGaps.push("System Design", "Advanced Optimization");
        roadmap.push("Begin studying distributed systems and high-level architecture design.");
      }
    }

    // 6. Save and return prediction
    const prediction = new PlacementPrediction({
      userId,
      readinessOverall,
      interviewReadiness,
      communicationReadiness,
      technicalReadiness,
      companyWise,
      skillGaps,
      roadmap
    });

    await prediction.save();
    res.status(200).json(prediction);
  } catch (error: any) {
    console.error('Prediction Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate prediction', details: error.message });
  }
};

// Fetch the most recent prediction
export const getLatestPrediction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.query.userId || 'student-1';
    const prediction = await PlacementPrediction.findOne({ userId }).sort({ createdAt: -1 });
    
    if (!prediction) {
      // Return 200 with null instead of 404 to avoid red browser console errors on first load
      return res.status(200).json(null);
    }

    res.status(200).json(prediction);
  } catch (error) {
    console.error('Fetch Prediction Error:', error);
    res.status(500).json({ error: 'Failed to fetch prediction' });
  }
};
