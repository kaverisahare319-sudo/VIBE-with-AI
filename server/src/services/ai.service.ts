import { PlacementPrediction } from '../../../shared/types';

export class AIService {
  static generatePlacementPrediction(scores: {
    atsScore: number;
    codingScore: number;
    communicationScore: number;
    bodyLanguageScore: number;
    gdScore: number;
    interviewScore: number;
  }): PlacementPrediction {
    const { atsScore, codingScore, communicationScore, bodyLanguageScore, gdScore, interviewScore } = scores;

    const technicalReadiness = Math.round((atsScore + codingScore) / 2);
    const communicationReadiness = Math.round((communicationScore + bodyLanguageScore + gdScore) / 3);
    const interviewReadiness = Math.round(interviewScore);
    const placementReadinessScore = Math.round((technicalReadiness + communicationReadiness + interviewReadiness) / 3);

    // Calculate company readiness based on sub-metrics
    const tcs = Math.min(100, Math.round(communicationReadiness * 0.4 + technicalReadiness * 0.4 + interviewReadiness * 0.2 + 5));
    const infosys = Math.min(100, Math.round(communicationReadiness * 0.35 + technicalReadiness * 0.45 + interviewReadiness * 0.2 + 4));
    const wipro = Math.min(100, Math.round(communicationReadiness * 0.3 + technicalReadiness * 0.5 + interviewReadiness * 0.2 + 3));
    const cognizant = Math.min(100, Math.round(communicationReadiness * 0.3 + technicalReadiness * 0.5 + interviewReadiness * 0.2 + 5));
    const accenture = Math.min(100, Math.round(communicationReadiness * 0.45 + technicalReadiness * 0.35 + interviewReadiness * 0.2 + 6));
    const capgemini = Math.min(100, Math.round(communicationReadiness * 0.4 + technicalReadiness * 0.4 + interviewReadiness * 0.2 + 4));
    
    // Product companies and startups need higher coding and interview readiness
    const productCompanies = Math.min(100, Math.round(codingScore * 0.5 + interviewReadiness * 0.3 + communicationReadiness * 0.2));
    const startups = Math.min(100, Math.round(codingScore * 0.4 + interviewReadiness * 0.4 + communicationReadiness * 0.2 + 2));

    const recommendations: string[] = [];
    if (codingScore < 80) {
      recommendations.push('Practice complex DSA problems (graphs, dynamic programming) to increase compatibility with product-based companies.');
    }
    if (atsScore < 80) {
      recommendations.push('Optimize resume with missing keywords like "Cloud Computing", "CI/CD pipelines", and "System Design".');
    }
    if (communicationScore < 80) {
      recommendations.push('Improve speaking speed stability and reduce filler word counts in Mock Interviews.');
    }
    if (bodyLanguageScore < 80) {
      recommendations.push('Focus on maintaining steady eye contact and an upright, engaged posture during webcam sessions.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Overall performance is outstanding. Start applying for high-tier Product roles and mock interview rounds.');
    }

    return {
      placementReadinessScore,
      interviewReadinessScore: interviewReadiness,
      communicationReadinessScore: communicationReadiness,
      technicalReadinessScore: technicalReadiness,
      companyReadiness: {
        tcs,
        infosys,
        wipro,
        cognizant,
        accenture,
        capgemini,
        productCompanies,
        startups,
      },
      recommendations,
    };
  }
}
