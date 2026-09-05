import { Request, Response } from 'express';
import OpenAI from 'openai';
import MockInterviewSession from '../models/MockInterviewSession';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

// Mock Fallbacks if OpenAI fails
const FALLBACK_QUESTIONS = [
  "Can you tell me about yourself and your background?",
  "What is the most challenging technical problem you have solved?",
  "How do you handle disagreements with team members?"
];

export const generateQuestions = async (req: Request, res: Response) => {
  try {
    const { role, level, type } = req.body;

    if (!role || !level || !type) {
      return res.status(400).json({ error: 'Role, Level, and Type are required' });
    }

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key') {
      const prompt = `You are an expert technical recruiter and interviewer.
Generate 3 distinct, challenging interview questions for a candidate applying for a ${level} ${role} role.
The interview type is: ${type}.
Format the output as a strict JSON array of strings, with no additional markdown formatting.
Example: ["Question 1?", "Question 2?", "Question 3?"]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0].message?.content || '[]';
      let questions = [];
      try {
        questions = JSON.parse(content);
      } catch (e) {
        // Fallback if parsing fails
        questions = FALLBACK_QUESTIONS;
      }

      res.status(200).json({ questions });
    } else {
      // Return fallback questions if no API key
      res.status(200).json({ questions: FALLBACK_QUESTIONS });
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions', questions: FALLBACK_QUESTIONS });
  }
};

export const evaluateInterview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId || 'student-1';
    const { role, level, type, questions, transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    let evaluation = {
      overallScore: 75,
      technicalAccuracy: 70,
      communicationSkills: 80,
      confidence: 75,
      strengths: ["Clear communication", "Good foundational knowledge"],
      weaknesses: ["Needs deeper technical explanations", "Frequent hesitations"],
      detailedFeedback: "You communicated your ideas well, but try to provide more specific technical examples to back up your points."
    };

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key') {
      const prompt = `You are an expert technical interviewer. Evaluate the candidate's interview performance based on the following:
Role: ${level} ${role} (${type})
Questions Asked: ${JSON.stringify(questions)}
Candidate Transcript: "${transcript}"

Provide a detailed evaluation in the following strict JSON format:
{
  "overallScore": number (0-100),
  "technicalAccuracy": number (0-100),
  "communicationSkills": number (0-100),
  "confidence": number (0-100),
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "detailedFeedback": "string"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0].message?.content || '{}';
      try {
        evaluation = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse evaluation JSON from OpenAI");
      }
    }

    const session = new MockInterviewSession({
      userId,
      role,
      level,
      type,
      questions,
      transcript,
      ...evaluation
    });

    await session.save();

    res.status(200).json(session);
  } catch (error) {
    console.error('Error evaluating interview:', error);
    res.status(500).json({ error: 'Failed to evaluate interview' });
  }
};
