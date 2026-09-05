import { Request, Response } from 'express';
import AIPlacementAssessment from '../models/AIPlacementAssessment';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export const saveAssessment = async (req: Request, res: Response) => {
  try {
    const {
      type, difficulty, duration, mode, companyName, customTopic,
      scores, feedback, transcript, hiringProbability
    } = req.body;

    // We assume the user ID is extracted from the auth middleware and attached to req.user
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const assessment = new AIPlacementAssessment({
      user: userId,
      type, difficulty, duration, mode, companyName, customTopic,
      scores, feedback, transcript, hiringProbability
    });

    await assessment.save();

    res.status(201).json({
      success: true,
      message: 'Assessment saved successfully',
      data: assessment
    });
  } catch (error) {
    console.error('Error saving AI placement assessment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAssessments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const assessments = await AIPlacementAssessment.find({ user: userId }).sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error fetching AI placement assessments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const generateQuestion = async (req: Request, res: Response) => {
  try {
    const { type, difficulty, customTopic, companyName, jobRole, history } = req.body;

    const aiQuestions = history.filter((h: any) => h.sender === 'AI').map((h: any) => h.text);
    const questionCount = aiQuestions.length;

    if (questionCount >= 10) {
      return res.status(200).json({ isComplete: true });
    }

    // Determine current interview stage
    let stage = 'Introduction & Self-Introduction';
    if (questionCount === 1) stage = 'Education & Academic Background';
    else if (questionCount === 2) stage = 'Projects & Practical Experience';
    else if (questionCount === 3) stage = 'Technical Fundamentals';
    else if (questionCount === 4) stage = 'Core Technical Concepts';
    else if (questionCount === 5) stage = 'Advanced Technical / Problem Solving';
    else if (questionCount === 6) stage = 'Coding Logic & Algorithms';
    else if (questionCount === 7) stage = 'Behavioral / Situational';
    else if (questionCount === 8) stage = 'Strengths, Weaknesses & HR';
    else if (questionCount === 9) stage = 'Closing & Candidate Questions';

    const lastCandidateAnswer = history.length > 0 && history[history.length - 1].sender === 'You'
      ? history[history.length - 1].text
      : 'None yet (start of interview)';

    // Build type-specific topic constraints
    const topicConstraintMap: Record<string, string> = {
      'Technical': `Focus STRICTLY on technical topics relevant to the role "${jobRole || 'Software Engineer'}". Topics include: Data Structures, Algorithms, OOP, DBMS, OS, Computer Networks, System Design, APIs, Web Development, Cloud basics, Debugging, and coding logic. After Q1 (intro) and Q2 (projects), ALL remaining questions must be purely technical. Do NOT ask HR or soft-skill questions unless the stage says Behavioral or HR.`,
      'HR': `Focus STRICTLY on HR topics: career goals, team fit, work ethic, salary expectations, strengths, weaknesses, why this company, and soft skills. Do NOT ask technical coding or DSA questions.`,
      'Behavioral': `Focus STRICTLY on behavioral/situational questions using the STAR method (Situation, Task, Action, Result). Ask about conflict resolution, leadership, team dynamics, problem-solving experiences, and real-world challenges. No pure technical questions.`,
      'System Design': `Focus STRICTLY on system design topics: scalability, microservices, databases, load balancing, caching, API design, distributed systems, CAP theorem, and real-world architecture challenges. Increase complexity per question.`,
      'Aptitude+HR': `Alternate between aptitude/logical reasoning questions and HR soft-skill questions. Keep a mix across the 10 questions.`,
      'Company Specific': `Focus on questions relevant to ${companyName || 'the target company'}: their tech stack, culture, interview style, domain-specific challenges, and skills they value. Include both technical and HR questions.`,
      'Custom': `Focus exclusively on: "${customTopic}". All questions must stay within this topic domain.`,
    };

    const topicConstraint = topicConstraintMap[type] || topicConstraintMap['Technical'];

    // Role-specific technical topic emphasis
    const roleTopicMap: Record<string, string> = {
      'Frontend Developer': 'HTML, CSS, JavaScript, React, DOM, Performance, Accessibility, APIs',
      'Backend Developer': 'Node.js, REST APIs, Authentication, Databases, Caching, Security, Microservices',
      'Full Stack Developer': 'React, Node.js, Databases, REST APIs, deployment, DevOps basics',
      'Java Developer': 'Java, OOP, Collections, Multithreading, Spring Boot, JVM, Design Patterns',
      'Python Developer': 'Python, Django/Flask, APIs, Pandas, OOP, Exception Handling, Algorithms',
      'Data Scientist': 'Machine Learning, Statistics, Python, Pandas, Model Evaluation, Data Wrangling',
      'DevOps Engineer': 'CI/CD, Docker, Kubernetes, Linux, Monitoring, Cloud, Infrastructure as Code',
      'Software Engineer': 'DSA, OOP, DBMS, OS, Computer Networks, System Design, Coding, APIs',
    };
    const roleFocus = roleTopicMap[jobRole || ''] || 'DSA, OOP, DBMS, OS, Algorithms, System Design, APIs';

    const prompt = `You are an expert senior technical interviewer at a top tech company conducting a ${difficulty} level ${type} interview for the role of "${jobRole || 'Software Engineer'}"${companyName ? ` at ${companyName}` : ''}${customTopic ? ` focused on "${customTopic}"` : ''}.

═══════════════════════════════
INTERVIEW PARAMETERS
═══════════════════════════════
Interview Type: ${type}
Job Role: ${jobRole || 'Software Engineer'}
Difficulty: ${difficulty}
Current Question: ${questionCount + 1} of 10
Stage: ${stage}
Role-Specific Topics: ${roleFocus}

═══════════════════════════════
TYPE-SPECIFIC RULES (MANDATORY)
═══════════════════════════════
${topicConstraint}

═══════════════════════════════
PREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT ANY)
═══════════════════════════════
${aiQuestions.length > 0 ? aiQuestions.map((q: string, i: number) => `Q${i + 1}: ${q}`).join('\n') : 'None yet — this is the first question.'}

═══════════════════════════════
CANDIDATE'S LAST ANSWER
═══════════════════════════════
"${lastCandidateAnswer}"

═══════════════════════════════
FULL CONVERSATION SO FAR
═══════════════════════════════
${history.map((h: any) => `${h.sender === 'You' ? 'Candidate' : 'Interviewer'}: ${h.text}`).join('\n')}

═══════════════════════════════
GENERATION RULES (STRICT)
═══════════════════════════════
1. Generate exactly ONE question for the current stage: "${stage}".
2. Base the question on the candidate's last answer — make it contextual and conversational.
3. NEVER repeat, rephrase, or closely resemble any question from [PREVIOUSLY ASKED QUESTIONS].
4. Difficulty must increase progressively: Q1-Q2=Easy, Q3-Q4=Medium, Q5-Q6=Hard, Q7-Q9=Advanced.
5. For Technical interviews: After Q1 (intro) and Q2 (projects), ALL questions MUST be purely technical. Never ask generic soft-skill or HR questions.
6. OUTPUT ONLY THE QUESTION. No label, no prefix like "Interviewer:", "AI:", "Question:", "Q5:". No greeting. No explanation. Just the question text.`;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.85,
        max_tokens: 200,
      });
      let question = response.choices[0].message?.content || "Can you walk me through your most challenging project?";
      // Strip any rogue prefixes the model may add despite instructions
      question = question.replace(/^(Interviewer|AI|Question\s*\d*|HR|Q\d+)[\s:\-.]*/i, '').replace(/^["']|["']$/g, '').trim();
      res.status(200).json({ question });
    } else {
      // Mock fallback that at least varies by question number and type
      const mockQuestions: Record<string, string[]> = {
        'Technical': [
          "Could you start by telling me a little about yourself?",
          "Describe a technical project you've worked on recently.",
          "What is the difference between an Array and a Linked List?",
          "Can you explain the four pillars of Object-Oriented Programming?",
          "What is a HashMap and how does it handle collisions?",
          "Explain the difference between Stack and Queue with a real-world example.",
          "How would you implement Binary Search? What is its time complexity?",
          "Can you explain different types of SQL JOINs?",
          "What are your greatest strengths and weaknesses as a developer?",
          "Do you have any questions for us?"
        ],
        'HR': [
          "Tell me about yourself.",
          "Why are you interested in this role?",
          "What are your greatest strengths?",
          "How do you handle pressure and tight deadlines?",
          "Where do you see yourself in 5 years?",
          "Tell me about a time you had to work in a team.",
          "What is your expected salary?",
          "Why are you leaving your current job?",
          "What is your biggest weakness?",
          "Do you have any questions for us?"
        ]
      };
      const qs = mockQuestions[type] || mockQuestions['Technical'];
      res.status(200).json({ question: qs[questionCount] || "Do you have any final questions for us?" });
    }
  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).json({ success: false, message: 'Failed to generate question' });
  }
};

export const evaluateInterview = async (req: Request, res: Response) => {
  try {
    const { transcript, type, difficulty, jobRole } = req.body;

    // Separate AI questions and candidate answers for per-Q analysis
    const pairs: { question: string; answer: string }[] = [];
    let lastQ = '';
    for (const msg of transcript) {
      if (msg.sender === 'AI') {
        lastQ = msg.text;
      } else if (msg.sender === 'You' && lastQ) {
        pairs.push({ question: lastQ, answer: msg.text });
        lastQ = '';
      }
    }

    const pairText = pairs.map((p, i) =>
      `Q${i + 1}: ${p.question}\nCandidate Answer: ${p.answer}`
    ).join('\n\n');

    const totalAnswerWords = pairs.reduce((acc, p) => acc + p.answer.split(/\s+/).length, 0);
    const avgWordsPerAnswer = pairs.length > 0 ? Math.round(totalAnswerWords / pairs.length) : 0;

    const fillerWordRegex = /\b(um|uh|like|you know|basically|actually|literally|so yeah|right|okay)\b/gi;
    const allAnswerText = pairs.map(p => p.answer).join(' ');
    const fillerCount = (allAnswerText.match(fillerWordRegex) || []).length;

    const prompt = `You are a senior expert HR panel evaluating a ${difficulty} level ${type} interview${jobRole ? ` for the role of "${jobRole}"` : ''}.

════════════════════════════════════════
FULL INTERVIEW TRANSCRIPT (Q&A PAIRS)
════════════════════════════════════════
${pairText || transcript.map((h: any) => `${h.sender === 'You' ? 'Candidate' : 'Interviewer'}: ${h.text}`).join('\n')}

════════════════════════════════════════
SPEECH STATISTICS (auto-detected)
════════════════════════════════════════
- Total candidate answers: ${pairs.length}
- Average words per answer: ${avgWordsPerAnswer}
- Detected filler words count: ${fillerCount} (um, uh, like, you know, basically, etc.)

════════════════════════════════════════
EVALUATION TASK
════════════════════════════════════════
Analyze the candidate's ACTUAL answers above. Every score must be derived purely from what the candidate actually said. 

SCORING RULES:
- One-word or very short answers → PENALIZE heavily (−20 to −40 points on relevant dimensions)
- Filler words > 5 → reduce Communication score
- Wrong technical answers → reduce Technical score significantly  
- Generic non-specific answers → reduce Problem Solving
- Strong detailed answers → reward with higher scores
- Confident clear structured answers → reward Communication and Confidence
- NEVER give the same score to every dimension — each must reflect the actual transcript

DIMENSION DEFINITIONS:
- technicalScore: Correctness, depth, accuracy of technical knowledge shown in answers
- communicationScore: Grammar, clarity, vocabulary, sentence structure, filler words, fluency
- problemSolvingScore: Logical approach, structured reasoning, edge cases considered, analytical depth
- confidenceScore: Assertiveness, decisiveness, clear opinion-giving, no excessive hedging
- bodyLanguageScore: Infer from answer quality — detailed confident answers imply good posture; nervous/short answers imply poor posture
- facialExpressionScore: Infer from engagement level — engaged responses = good eye contact; vague/off-topic = distracted
- professionalismScore: Respectful tone, appropriate vocabulary, structured greetings/closings, interview etiquette
- voiceScore: Infer from sentence variety, pacing (avg words/answer), and absence of filler words

PER-QUESTION ANALYSIS:
For each Q&A pair, provide a brief quality label: "Excellent" | "Good" | "Average" | "Poor" | "Very Poor"

WEIGHTED FORMULA (you do NOT need to calculate this — just provide raw scores):
- Overall = (technical×0.30) + (communication×0.20) + (problemSolving×0.20) + (confidence×0.10) + (bodyLanguage×0.05) + (facialExpression×0.05) + (professionalism×0.05) + (voice×0.05)

Return ONLY valid JSON in this exact structure:
{
  "technicalScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "problemSolvingScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "bodyLanguageScore": <number 0-100>,
  "professionalismScore": <number 0-100>,
  "facialExpressionScore": <number 0-100>,
  "voiceScore": <number 0-100>,
  "strengths": [<5 specific personalized strength strings based on ACTUAL answers>],
  "improvements": [<5 specific personalized improvement strings based on ACTUAL answers>],
  "detailedAnalysis": "<3-4 sentence narrative summary that is specific to THIS candidate's actual answers — never generic>",
  "perQuestionRating": [<for each Q&A pair: "Excellent"|"Good"|"Average"|"Poor"|"Very Poor">],
  "hiringRecommendation": "<one of: Strong Hire | Hire | Borderline | No Hire>",
  "speakingStats": {
    "totalWords": ${totalAnswerWords},
    "avgWordsPerAnswer": ${avgWordsPerAnswer},
    "fillerWordsDetected": ${fillerCount},
    "answerCount": ${pairs.length}
  }
}`;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.15,
        response_format: { type: 'json_object' },
        max_tokens: 1200,
      });

      const content = response.choices[0].message?.content || '{}';
      const aiRes = JSON.parse(content);

      // Clamp all scores to 0–100
      const clamp = (v: any) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));

      const scores = {
        technical: clamp(aiRes.technicalScore),
        communication: clamp(aiRes.communicationScore),
        problemSolving: clamp(aiRes.problemSolvingScore),
        confidence: clamp(aiRes.confidenceScore),
        bodyLanguage: clamp(aiRes.bodyLanguageScore),
        professionalism: clamp(aiRes.professionalismScore),
        facialExpression: clamp(aiRes.facialExpressionScore),
        voice: clamp(aiRes.voiceScore),
      };

      const overall = Math.round(
        scores.technical * 0.30 +
        scores.communication * 0.20 +
        scores.problemSolving * 0.20 +
        scores.confidence * 0.10 +
        scores.bodyLanguage * 0.05 +
        scores.facialExpression * 0.05 +
        scores.professionalism * 0.05 +
        scores.voice * 0.05
      );

      const hiringProbability = Math.max(0, Math.min(100, Math.round(
        overall * 0.75 + scores.technical * 0.15 + scores.confidence * 0.10
      )));

      res.status(200).json({
        scores: { ...scores, overall, overallEmployability: overall },
        feedback: {
          strengths: Array.isArray(aiRes.strengths) ? aiRes.strengths.slice(0, 5) : [],
          improvements: Array.isArray(aiRes.improvements) ? aiRes.improvements.slice(0, 5) : [],
          detailedAnalysis: aiRes.detailedAnalysis || '',
          perQuestionRating: Array.isArray(aiRes.perQuestionRating) ? aiRes.perQuestionRating : [],
          hiringRecommendation: aiRes.hiringRecommendation || 'Borderline',
          speakingStats: aiRes.speakingStats || {
            totalWords: totalAnswerWords,
            avgWordsPerAnswer,
            fillerWordsDetected: fillerCount,
            answerCount: pairs.length,
          },
        },
        hiringProbability,
      });

    } else {
      // Smart mock fallback — uses real metrics from transcript so at least varies by interview
      const baseScore = Math.min(95, Math.max(25,
        40 + // baseline
        Math.min(30, avgWordsPerAnswer * 0.5) + // reward detailed answers
        Math.max(-20, -fillerCount * 2) + // penalize filler words
        (pairs.length >= 8 ? 10 : pairs.length * 1.5) // reward completing the interview
      ));

      const variance = (offset: number) => Math.max(0, Math.min(100, Math.round(baseScore + offset + (Math.random() * 10 - 5))));

      const techOffset = type === 'Technical' ? 5 : -5;
      const scores = {
        technical: variance(techOffset),
        communication: variance(-fillerCount * 2),
        problemSolving: variance(0),
        confidence: variance(avgWordsPerAnswer > 20 ? 5 : -10),
        bodyLanguage: variance(-5),
        professionalism: variance(3),
        facialExpression: variance(-3),
        voice: variance(-fillerCount),
      };

      const overall = Math.round(
        scores.technical * 0.30 + scores.communication * 0.20 +
        scores.problemSolving * 0.20 + scores.confidence * 0.10 +
        scores.bodyLanguage * 0.05 + scores.facialExpression * 0.05 +
        scores.professionalism * 0.05 + scores.voice * 0.05
      );

      res.status(200).json({
        scores: { ...scores, overall, overallEmployability: overall },
        feedback: {
          strengths: [
            `Completed ${pairs.length} interview questions`,
            avgWordsPerAnswer > 30 ? 'Provided detailed and elaborated answers' : 'Concise and focused responses',
            fillerCount < 3 ? 'Clean speech with minimal filler words' : 'Attempted to maintain conversational flow',
            'Maintained professional interview conduct',
            'Demonstrated willingness to engage with all questions',
          ],
          improvements: [
            fillerCount > 5 ? `Reduce filler words (detected ~${fillerCount} instances of "um/uh/like")` : 'Continue building vocabulary depth',
            avgWordsPerAnswer < 20 ? 'Expand answers with specific examples and details' : 'Maintain answer depth consistently',
            'Back every technical claim with a real-world example',
            'Practice structured responses using the STAR method',
            'Build confidence by rehearsing out loud before interviews',
          ],
          detailedAnalysis: `The candidate completed a ${difficulty} ${type} interview with ${pairs.length} questions answered. Average response length was ${avgWordsPerAnswer} words per answer. ${fillerCount > 5 ? `Filler words were detected ${fillerCount} times, which may impact perceived communication quality.` : 'Speech was relatively clean with minimal filler words.'} Overall performance indicates a ${overall >= 70 ? 'above average' : overall >= 50 ? 'moderate' : 'developing'} readiness for the target role. (Note: Install OpenAI API key for real AI evaluation.)`,
          perQuestionRating: pairs.map(() => ['Good', 'Average', 'Excellent', 'Poor', 'Good'][Math.floor(Math.random() * 5)]),
          hiringRecommendation: overall >= 75 ? 'Hire' : overall >= 55 ? 'Borderline' : 'No Hire',
          speakingStats: { totalWords: totalAnswerWords, avgWordsPerAnswer, fillerWordsDetected: fillerCount, answerCount: pairs.length },
        },
        hiringProbability: Math.max(0, Math.min(100, Math.round(overall * 0.75 + scores.technical * 0.15 + scores.confidence * 0.10))),
      });
    }
  } catch (error) {
    console.error('Error evaluating interview:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate interview' });
  }
};
