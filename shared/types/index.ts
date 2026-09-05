export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
}

export interface AIInsights {
  strengths: string[];
  weaknesses: string[];
}

export interface OptimizedContent {
  summary: string;
  skills: string[];
  projectHighlights: string[];
  experienceHighlights: string[];
  achievements: string[];
}

export interface ResumeAnalysis {
  // Core ATS Score
  score: number;
  // Section-wise scores
  structureScore: number;
  skillsScore: number;
  projectsScore: number;
  experienceScore: number;
  contentQualityScore: number;
  readabilityScore: number;
  keywordScore: number;
  // Classification
  classification: 'Student' | 'Fresher' | 'Experienced';
  // Gap Analysis
  missingContactInfo: string[];
  missingKeywords: string[];
  missingSkills: string[];
  // Evaluation
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  filename: string;
  // Role targeting
  targetRole?: string | null;
  roleMatchLabel?: 'Strong Match' | 'Moderate Match' | 'Weak Match';
  // AI Optimization
  optimizedScore: number;
  optimizedStructureScore: number;
  optimizedSkillsScore: number;
  optimizedProjectsScore: number;
  optimizedExperienceScore: number;
  optimizedKeywordScore: number;
  optimizedContentScore: number;
  optimizedReadabilityScore: number;
  keywordsAdded: number;
  skillsAdded: number;
  atsIncrease: number;
  readabilityIncrease: number;
  structureIncrease: number;
  aiInsights: AIInsights;
  optimizedContent: OptimizedContent;
}

export interface CodingAssessment {
  score: number;
  timeTaken: string;
  testCasesPassed: string;
  complexityAnalysis: string;
  aiCodeReview: string;
  suggestions: string[];
  improvementAreas: string[];
}

export interface CommunicationAnalysis {
  fluencyScore: number;
  confidenceScore: number;
  speakingSpeed: string;
  grammarAccuracy: number;
  pronunciationScore: number;
  feedback: string;
  suggestions: string[];
}

export interface BodyLanguageAnalysis {
  eyeContactScore: number;
  confidenceScore: number;
  facialExpressionAnalysis: string;
  postureAnalysis: string;
  bodyLanguageScore: number;
  feedback: string;
  suggestions: string[];
}

export interface MockInterview {
  type: 'technical' | 'hr' | 'behavioral' | 'company';
  company?: string;
  interviewScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  aiFeedback: string;
  suggestedAnswers: { question: string; answer: string; feedback: string }[];
}

export interface GdSimulator {
  topic: string;
  participationScore: number;
  leadershipScore: number;
  teamworkScore: number;
  communicationScore: number;
  confidenceScore: number;
  performanceFeedback: string;
  suggestions: string[];
}

export interface PlacementPrediction {
  placementReadinessScore: number;
  interviewReadinessScore: number;
  communicationReadinessScore: number;
  technicalReadinessScore: number;
  companyReadiness: {
    tcs: number;
    infosys: number;
    wipro: number;
    cognizant: number;
    accenture: number;
    capgemini: number;
    productCompanies: number;
    startups: number;
  };
  recommendations: string[];
}

export interface DashboardOverview {
  overallPlacementReadiness: number;
  latestAtsScore: number;
  codingScore: number;
  communicationScore: number;
  interviewReadinessScore: number;
  recentActivities: {
    id: string;
    type: string;
    description: string;
    date: string;
  }[];
}

export interface ResumeValidationResponse {
  isValid: boolean;
  confidenceScore: number;
  message: string;
}

