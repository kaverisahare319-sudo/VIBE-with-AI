import { MockInterview } from '../../../shared/types';

export class InterviewService {
  static getQuestions(type: 'technical' | 'hr' | 'behavioral' | 'company', company?: string): string[] {
    if (type === 'company' && company) {
      const companyUpper = company.toUpperCase();
      if (companyUpper.includes('TCS')) {
        return [
          'What is the difference between compiler and interpreter? How does it relate to Java?',
          'What is a primary key vs foreign key? Explain with a query.',
          'Describe a situation where you had to work under a tight deadline.'
        ];
      }
      if (companyUpper.includes('ACCENTURE')) {
        return [
          'Explain Cloud Computing models (IaaS, PaaS, SaaS).',
          'What are abstract classes vs interfaces in OOP?',
          'How do you manage stress when working on multiple client modules?'
        ];
      }
      if (companyUpper.includes('INFOSYS') || companyUpper.includes('WIPRO')) {
        return [
          'What is a Class and Object? Give real-life examples.',
          'Write a function to check if a string is a palindrome.',
          'Why do you want to join our organization?'
        ];
      }
    }

    if (type === 'technical') {
      return [
        'Explain the Event Loop in JavaScript.',
        'How does a REST API handle request statelessness?',
        'Describe the differences between SQL and NoSQL databases.',
        'What is an Index in database management systems and how does it speed up queries?'
      ];
    }

    if (type === 'hr') {
      return [
        'Tell me about yourself.',
        'What are your greatest strengths and weaknesses?',
        'Where do you see yourself in five years?',
        'Why should we hire you over other candidates?'
      ];
    }

    // Default behavioral questions
    return [
      'Describe a time you resolved a conflict within a development team.',
      'Explain a project failure you experienced and how you recovered.',
      'How do you handle ambiguous requirements when starting a feature?'
    ];
  }

  static evaluateInterview(
    type: 'technical' | 'hr' | 'behavioral' | 'company',
    company: string | undefined,
    answers: { question: string; answer: string }[]
  ): MockInterview {
    // Return realistic calculations based on answering length and quality
    const wordCounts = answers.map(a => a.answer.trim().split(/\s+/).length);
    const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / answers.length;

    let technicalScore = type === 'technical' || type === 'company' ? 82 : 75;
    let communicationScore = avgWordCount > 20 ? 85 : 70;
    let confidenceScore = avgWordCount > 15 ? 88 : 65;

    // Adjust scores slightly based on inputs
    if (avgWordCount < 8) {
      technicalScore -= 15;
      communicationScore -= 20;
      confidenceScore -= 25;
    }

    const interviewScore = Math.round((technicalScore + communicationScore + confidenceScore) / 3);

    const suggestedAnswers = answers.map(a => {
      let feedback = 'Good length and structure. Ready for live panel.';
      let suggested = 'Try emphasizing quantitative results and standard engineering principles (e.g. STAR method).';
      
      if (a.answer.trim().split(/\s+/).length < 10) {
        feedback = 'Answer is too brief. Expand with concrete examples from your coursework or projects.';
        suggested = `For "${a.question}", structure your answer using Situation, Task, Action, and Result (STAR technique). Make sure to speak for at least 1-2 minutes.`;
      }

      return {
        question: a.question,
        answer: a.answer,
        feedback,
        suggested
      };
    });

    return {
      type,
      company,
      interviewScore,
      technicalScore,
      communicationScore,
      confidenceScore,
      aiFeedback: interviewScore > 80 
        ? 'Excellent presentation. You demonstrate solid domain knowledge, structural thinking, and smooth verbal pacing.'
        : 'Solid effort, but answers lack technical depth. Add specific frameworks, architectures, or metric outcomes to support your statements.',
      suggestedAnswers
    };
  }
}
