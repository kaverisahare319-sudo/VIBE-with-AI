import { ResumeAnalysis, ResumeValidationResponse, AIInsights, OptimizedContent } from '../../../shared/types';

export class ResumeService {

  // ─────────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────────
  static validateResume(filename: string, text: string): ResumeValidationResponse {
    const t = text.trim().toLowerCase();

    if (t.length === 0) {
      return { isValid: false, confidenceScore: 0, message: 'This document appears to be empty or image-based. OCR processing required.' };
    }

    if (t.length < 100) {
      return { isValid: false, confidenceScore: 5, message: 'Document is too short to be a resume. Please upload a professional resume.' };
    }

    const rejectionKeywords = [
      'invoice', 'bill amount', 'receipt', 'question paper', 'table of contents', 'chapter 1', 'bibliography',
      'certificate', 'marksheet', 'research paper', 'assignment', 'notes', 'book pdf', 'case study',
      'abstract', 'introduction', 'conclusion', 'references', 'methodology'
    ];
    const rejectionCount = rejectionKeywords.filter(kw => t.includes(kw)).length;
    if (rejectionCount >= 2 || t.includes('case study') || t.includes('research paper') || t.includes('assignment') || t.includes('marksheet')) {
      return { isValid: false, confidenceScore: 10, message: 'Please upload a valid Resume or CV.\n\nThe uploaded file does not appear to be a professional resume. ATS analysis is available only for resumes and CVs.' };
    }

    const resumeKeywords = [
      'education', 'academic', 'skills', 'technical skills', 'experience',
      'work experience', 'internship', 'project', 'projects', 'certification',
      'certifications', 'objective', 'profile', 'summary', 'career objective', 'professional summary', 'github',
      'linkedin', 'achievements', 'contact', 'email'
    ];

    const matched = resumeKeywords.filter(kw => t.includes(kw)).length;
    const hasCore = t.includes('education') || t.includes('experience') || t.includes('skills');

    let confidenceScore = Math.min(100, Math.round((matched / 10) * 100));

    if (!hasCore) {
      confidenceScore = Math.min(confidenceScore, 40);
    }

    console.log('Text Length:', t.length);
    console.log('Matched Resume Keywords:', matched);
    console.log('Resume Confidence Score:', confidenceScore);

    if (confidenceScore >= 70 && hasCore) {
      return { isValid: true, confidenceScore, message: 'Valid Resume Detected.' };
    }

    return { isValid: false, confidenceScore, message: 'Please upload a valid Resume or CV.\n\nThe uploaded file does not appear to be a professional resume. ATS analysis is available only for resumes and CVs.' };
  }

  // ─────────────────────────────────────────────────────────────────
  // ROLE SKILL DEFINITIONS
  // ─────────────────────────────────────────────────────────────────
  static readonly ROLE_SKILLS: Record<string, string[]> = {
    'Java Developer':                 ['java', 'spring', 'spring boot', 'hibernate', 'maven', 'gradle', 'junit', 'rest api', 'microservices', 'sql', 'git', 'oop', 'data structures'],
    'Python Developer':               ['python', 'django', 'flask', 'fastapi', 'rest api', 'sql', 'git', 'oop', 'data structures', 'problem solving', 'numpy', 'pandas'],
    'MERN Stack Developer':           ['mongodb', 'express', 'react', 'node', 'rest api', 'jwt', 'redux', 'git', 'docker', 'javascript', 'typescript'],
    'Full Stack Developer':           ['javascript', 'typescript', 'react', 'node', 'express', 'sql', 'mongodb', 'rest api', 'git', 'docker', 'html', 'css'],
    'Frontend Developer':             ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'sass', 'redux', 'webpack', 'vite', 'figma', 'responsive design'],
    'Backend Developer':              ['node', 'express', 'python', 'django', 'spring', 'rest api', 'graphql', 'sql', 'postgresql', 'redis', 'docker', 'microservices', 'git'],
    'AI / Machine Learning Engineer': ['python', 'tensorflow', 'pytorch', 'scikit-learn', 'numpy', 'pandas', 'keras', 'opencv', 'nlp', 'deep learning', 'machine learning', 'model deployment', 'statistics', 'data structures'],
    'Data Scientist':                 ['python', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'matplotlib', 'sql', 'statistics', 'machine learning', 'jupyter', 'data visualization', 'r'],
    'Data Analyst':                   ['python', 'sql', 'excel', 'tableau', 'power bi', 'pandas', 'numpy', 'data visualization', 'statistics', 'matplotlib'],
    'DevOps Engineer':                ['docker', 'kubernetes', 'jenkins', 'github actions', 'linux', 'bash', 'ansible', 'terraform', 'aws', 'ci/cd', 'nginx', 'monitoring'],
    'Cloud Engineer':                 ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'linux', 'networking', 'iam', 'cloudformation', 'lambda', 's3'],
    'Cyber Security':                 ['penetration testing', 'ethical hacking', 'kali linux', 'wireshark', 'nmap', 'firewalls', 'siem', 'soc', 'network security', 'vulnerability assessment', 'owasp'],
    'UI/UX Designer':                 ['figma', 'adobe xd', 'sketch', 'prototyping', 'wireframing', 'user research', 'usability testing', 'design systems', 'typography', 'responsive design'],
    'Mobile App Developer':           ['react native', 'flutter', 'android', 'ios', 'kotlin', 'swift', 'dart', 'firebase', 'rest api', 'git', 'xcode', 'android studio'],
    'Blockchain Developer':           ['solidity', 'ethereum', 'web3.js', 'smart contracts', 'hardhat', 'truffle', 'nft', 'defi', 'ipfs', 'cryptography', 'javascript'],
    'Software Engineer':              ['data structures', 'algorithms', 'oop', 'git', 'rest api', 'sql', 'unit testing', 'agile', 'problem solving', 'system design'],
    'Embedded Systems':               ['c', 'c++', 'rtos', 'microcontrollers', 'arm', 'uart', 'i2c', 'spi', 'embedded c', 'pcb', 'keil', 'stm32'],
    'IoT Developer':                  ['c', 'c++', 'python', 'mqtt', 'raspberry pi', 'arduino', 'aws iot', 'rest api', 'tcp/ip', 'microcontrollers', 'sensors'],
    'Testing / QA Engineer':          ['selenium', 'jest', 'cypress', 'junit', 'pytest', 'postman', 'manual testing', 'test cases', 'bug tracking', 'agile', 'jira', 'api testing'],
  };

  // ─────────────────────────────────────────────────────────────────
  // DYNAMIC AI-DRIVEN ATS ANALYSIS (role-aware)
  // ─────────────────────────────────────────────────────────────────
  static analyzeResume(filename: string, text: string, targetRole?: string): ResumeAnalysis {
    const t = text.toLowerCase();
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const words = t.split(/\s+/).filter(w => w.length > 1);
    const wordCount = words.length;
    const charCount = text.length;

    // ── HELPERS ──────────────────────────────────────────────────
    const has = (patterns: (string | RegExp)[]): boolean =>
      patterns.some(p => typeof p === 'string' ? t.includes(p) : p.test(text));

    const countMatches = (list: string[]): number =>
      list.filter(item => t.includes(item.toLowerCase())).length;

    // ── SECTION DETECTION ────────────────────────────────────────
    const sections = {
      contact:        has([/\b(email|phone|mobile|tel|contact)\b/i]),
      education:      has([/\b(education|academic|degree|university|college|bachelor|master|b\.?tech|m\.?tech|b\.?e|b\.?sc|m\.?sc|cgpa|gpa)\b/i]),
      experience:     has([/\b(experience|employment|work\s+history|internship|intern)\b/i]),
      skills:         has([/\b(skills|competencies|expertise|technologies|tech\s+stack)\b/i]),
      projects:       has([/\bprojects?\b/i]),
      summary:        has([/\b(summary|objective|profile|about\s+me)\b/i]),
      certifications: has([/\b(certif|certified|credential|coursera|udemy|nptel)\b/i]),
      achievements:   has([/\b(achievement|award|honor|recognition|accomplishment)\b/i]),
      github:         has([/github/i]),
      linkedin:       has([/linkedin/i]),
    };
    const sectionCount = Object.values(sections).filter(Boolean).length;

    // ── 1. STRUCTURE SCORE ───────────────────────────────────────
    let structureScore = 0;
    if (sections.contact)        structureScore += 12;
    if (sections.education)      structureScore += 18;
    if (sections.experience)     structureScore += 18;
    if (sections.skills)         structureScore += 18;
    if (sections.projects)       structureScore += 14;
    if (sections.summary)        structureScore += 8;
    if (sections.certifications) structureScore += 5;
    if (sections.achievements)   structureScore += 4;
    if (sections.github)         structureScore += 2;
    if (sections.linkedin)       structureScore += 1;
    structureScore = Math.min(100, structureScore);

    // ── 2. SKILLS SCORE ──────────────────────────────────────────
    const skillGroups: Record<string, string[]> = {
      languages:  ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang', 'rust', 'kotlin', 'swift', 'php', 'ruby', 'scala', 'dart', 'r', 'c'],
      frontend:   ['react', 'vue', 'angular', 'next.js', 'nextjs', 'svelte', 'html', 'css', 'tailwind', 'sass', 'scss', 'webpack', 'vite', 'redux', 'jquery'],
      backend:    ['node', 'express', 'django', 'flask', 'spring', 'fastapi', 'laravel', 'nestjs', 'graphql', 'rest', 'grpc', 'rails'],
      databases:  ['mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'firebase', 'dynamodb', 'cassandra', 'elasticsearch', 'sql', 'nosql'],
      devops:     ['docker', 'kubernetes', 'jenkins', 'nginx', 'linux', 'bash', 'ansible', 'terraform'],
      cloud:      ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify', 'cloudflare'],
      tools:      ['git', 'github', 'gitlab', 'jira', 'figma', 'postman', 'vs code'],
      ml:         ['tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'keras', 'opencv', 'machine learning', 'deep learning'],
      mobile:     ['react native', 'flutter', 'android', 'ios'],
    };

    const allTechSkills = Object.values(skillGroups).flat();
    const foundSkillsList: string[] = [];

    allTechSkills.forEach(skill => {
      if (t.includes(skill)) foundSkillsList.push(skill);
    });

    const foundSkillCount = foundSkillsList.length;
    const skillsScore = Math.min(100, Math.max(12, Math.round(
      (foundSkillCount / allTechSkills.length) * 100 * 2.8
    )));

    // ── ROLE-SPECIFIC MISSING SKILLS ─────────────────────────────
    let missingSkills: string[];
    let roleSkillsRequired: string[] = [];

    if (targetRole && targetRole !== 'Other' && ResumeService.ROLE_SKILLS[targetRole]) {
      roleSkillsRequired = ResumeService.ROLE_SKILLS[targetRole];
      missingSkills = roleSkillsRequired
        .filter(s => !t.includes(s.toLowerCase()))
        .slice(0, 8);
    } else {
      const priorityMissing = ['docker', 'kubernetes', 'aws', 'postgresql', 'redis', 'typescript', 'graphql', 'terraform', 'ci/cd', 'linux'];
      missingSkills = priorityMissing.filter(s => !t.includes(s)).slice(0, 6);
      roleSkillsRequired = priorityMissing;
    }

    // ── ROLE MATCH LABEL ─────────────────────────────────────────
    let roleMatchLabel: 'Strong Match' | 'Moderate Match' | 'Weak Match' = 'Moderate Match';
    if (roleSkillsRequired.length > 0) {
      const roleMatched = roleSkillsRequired.filter(s => t.includes(s.toLowerCase())).length;
      const pct = roleMatched / roleSkillsRequired.length;
      if (pct >= 0.6)       roleMatchLabel = 'Strong Match';
      else if (pct >= 0.35) roleMatchLabel = 'Moderate Match';
      else                  roleMatchLabel = 'Weak Match';
    }

    // ── 3. PROJECTS SCORE ────────────────────────────────────────
    const projectMatches = text.match(/\bproject\b/gi) || [];
    const projectCount = projectMatches.length;
    const hasProjectLinks   = /github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+|live\s+(?:link|demo|url)|deployed\s+at|netlify|vercel\.app/i.test(text);
    const hasProjectMetrics = /\d+\s*%|\d+\s*users?|\d+\s*ms\b|\d+x\s*(faster|reduction|improvement)|\$\s*\d+|\d+\s*(clients?|features?|bugs?)/i.test(text);
    const hasProjectTech    = foundSkillCount >= 3;
    const hasProjectDesc    = wordCount > 250;

    let projectsScore = 0;
    projectsScore += Math.min(45, projectCount * 11);
    if (hasProjectLinks)   projectsScore += 22;
    if (hasProjectMetrics) projectsScore += 20;
    if (hasProjectTech)    projectsScore += 8;
    if (hasProjectDesc)    projectsScore += 5;
    projectsScore = Math.min(100, projectsScore);

    // ── 4. EXPERIENCE SCORE ──────────────────────────────────────
    const actionVerbs = [
      'developed', 'designed', 'built', 'created', 'implemented', 'managed', 'led', 'architected',
      'optimized', 'reduced', 'increased', 'delivered', 'deployed', 'automated', 'streamlined',
      'collaborated', 'mentored', 'migrated', 'integrated', 'launched', 'maintained', 'engineered',
      'analyzed', 'researched', 'coordinated', 'established', 'improved', 'enhanced', 'contributed',
      'configured', 'resolved', 'refactored', 'monitored', 'secured', 'documented'
    ];
    let actionVerbCount = 0;
    actionVerbs.forEach(v => {
      const hits = (t.match(new RegExp(`\\b${v}\\w*\\b`, 'g')) || []).length;
      actionVerbCount += hits;
    });

    const hasQuantifiedResults = /\d+\s*%|\$\s*\d+|\d+\s*(million|thousand|k)\b|\d+x\s*(faster|better|more)|\d+\s+(projects?|features?|bugs?|clients?|endpoints?)/i.test(text);
    const hasYearsExp          = /\d+\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/i.test(text);
    const hasInternship        = /\bintern\b/i.test(text);
    const hasSeniorTitle       = /\b(senior|lead|principal|architect|staff)\b/i.test(text);

    let experienceScore = 0;
    experienceScore += Math.min(48, actionVerbCount * 2.5);
    if (hasQuantifiedResults)  experienceScore += 30;
    if (hasYearsExp)           experienceScore += 12;
    if (hasInternship)         experienceScore += 7;
    if (hasSeniorTitle)        experienceScore += 3;
    if (wordCount > 400)       experienceScore += 5;
    if (sections.experience)   experienceScore += 5;
    experienceScore = Math.min(100, experienceScore);

    // ── 5. KEYWORD SCORE ─────────────────────────────────────────
    const atsKeywords = [
      'agile', 'scrum', 'kanban', 'ci/cd', 'devops', 'microservices', 'rest api', 'restful',
      'object-oriented', 'oop', 'data structures', 'algorithms', 'version control',
      'unit testing', 'test-driven', 'tdd', 'problem solving', 'cross-functional',
      'stakeholder', 'deadline', 'performance optimization',
    ];
    const atsMatches = countMatches(atsKeywords);
    const keywordScore = Math.min(100, Math.max(10, Math.round(
      (atsMatches / atsKeywords.length) * 45 +
      (foundSkillCount / allTechSkills.length) * 55 * 2
    )));
    const missingKeywords = atsKeywords
      .filter(kw => !t.includes(kw))
      .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1))
      .slice(0, 8);

    // ── 6. READABILITY SCORE ─────────────────────────────────────
    let readabilityScore = 55;
    if (charCount >= 1500 && charCount <= 5000) readabilityScore += 25;
    else if (charCount >= 800 && charCount < 1500) readabilityScore += 15;
    else if (charCount < 500)  readabilityScore -= 30;
    else if (charCount > 7000) readabilityScore -= 20;
    const shortLines = lines.filter(l => l.trim().length < 120).length;
    if (lines.length > 0 && shortLines / lines.length > 0.5) readabilityScore += 15;
    if (sectionCount >= 5) readabilityScore += 5;
    readabilityScore = Math.min(100, Math.max(20, readabilityScore));

    // ── 7. CONTENT QUALITY SCORE ─────────────────────────────────
    let contentQualityScore = 5;
    contentQualityScore += Math.min(45, actionVerbCount * 2.5);
    if (hasQuantifiedResults)  contentQualityScore += 35;
    if (sections.summary)      contentQualityScore += 8;
    if (wordCount > 400)       contentQualityScore += 5;
    if (wordCount > 700)       contentQualityScore += 5;
    if (sections.achievements) contentQualityScore += 2;
    contentQualityScore = Math.min(100, contentQualityScore);

    // ── OVERALL ATS SCORE ────────────────────────────────────────
    const score = Math.min(98, Math.max(22, Math.round(
      structureScore      * 0.18 +
      skillsScore         * 0.22 +
      projectsScore       * 0.15 +
      experienceScore     * 0.20 +
      keywordScore        * 0.12 +
      readabilityScore    * 0.07 +
      contentQualityScore * 0.06
    )));

    // ── CONTACT INFO ─────────────────────────────────────────────
    const missingContactInfo: string[] = [];
    if (!/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) missingContactInfo.push('Email');
    if (!/(\+?\d[\d\s\-(). ]{7,}\d)/.test(text)) missingContactInfo.push('Phone');
    if (!sections.github)   missingContactInfo.push('GitHub');
    if (!sections.linkedin) missingContactInfo.push('LinkedIn');

    // ── CLASSIFICATION ───────────────────────────────────────────
    let classification: 'Student' | 'Fresher' | 'Experienced' = 'Fresher';
    const yearsMatch = t.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/i);
    const yearsExp   = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
    if (yearsExp >= 3 || hasSeniorTitle) classification = 'Experienced';
    else if (t.includes('student') || t.includes('pursuing') || t.includes('university') || t.includes('college')) classification = 'Student';

    // ── AI INSIGHTS (role-aware) ─────────────────────────────────
    const insightStrengths: string[] = [];
    const insightWeaknesses: string[] = [];

    if (structureScore >= 70) insightStrengths.push('Well-structured resume with clear, defined sections');
    else insightWeaknesses.push('Missing critical sections — add Education, Skills, Experience, Projects');

    if (skillsScore >= 60) insightStrengths.push(`Strong tech stack: ${foundSkillsList.slice(0, 4).join(', ')}`);
    else insightWeaknesses.push('Limited tech skills listed — add in-demand technologies');

    if (projectsScore >= 55) insightStrengths.push('Good project portfolio with relevant technologies');
    else insightWeaknesses.push('Projects section is thin — add 2–3 detailed projects with GitHub links');

    if (hasQuantifiedResults) insightStrengths.push('Includes measurable achievements with numbers & metrics');
    else insightWeaknesses.push('No quantified results — add percentages, scale (users, time, cost saved)');

    if (experienceScore >= 60) insightStrengths.push('Effective use of action verbs in experience descriptions');
    else insightWeaknesses.push('Experience bullets are weak — start every point with a strong action verb');

    if (sections.github) insightStrengths.push('GitHub profile linked — demonstrates active portfolio');
    else insightWeaknesses.push('No GitHub profile — essential for software engineering roles');

    if (sections.certifications) insightStrengths.push('Certifications listed — adds credibility to your profile');
    else insightWeaknesses.push('No certifications — add cloud/tech certs (AWS, Google, etc.)');

    if (keywordScore >= 55) insightStrengths.push('Good ATS keyword coverage for technical roles');
    else insightWeaknesses.push('Low ATS keyword density — missing: Agile, CI/CD, REST API, microservices');

    if (contentQualityScore >= 60) insightStrengths.push('Content demonstrates strong impact and clarity');
    else insightWeaknesses.push('Content quality is low — quantify impact and use achievement-driven language');

    if (sections.linkedin) insightStrengths.push('LinkedIn profile present');
    else insightWeaknesses.push('LinkedIn URL missing from contact section');

    const aiInsights: AIInsights = {
      strengths:  insightStrengths.slice(0, 5),
      weaknesses: insightWeaknesses.slice(0, 5),
    };

    const strengths  = aiInsights.strengths.slice(0, 4);
    const weaknesses = aiInsights.weaknesses.slice(0, 4);

    // ── SUGGESTIONS (role-specific) ───────────────────────────────
    const suggestions: string[] = [];
    const roleName = targetRole && targetRole !== 'Other' ? targetRole : null;

    if (!sections.summary)
      suggestions.push('Add a Professional Summary at the top — it is the first thing ATS and recruiters see.');
    if (missingSkills.length) {
      if (roleName)
        suggestions.push(`Add these ${roleName} skills to boost your ATS score: ${missingSkills.slice(0, 4).join(', ')}.`);
      else
        suggestions.push(`Add high-demand skills: ${missingSkills.slice(0, 3).join(', ')}.`);
    }
    if (!hasQuantifiedResults)
      suggestions.push('Quantify your achievements: "Reduced load time by 40%", "Built for 10,000+ users".');
    if (!sections.github)
      suggestions.push('Add your GitHub profile URL — critical for software engineering roles.');
    if (!sections.certifications) {
      if (roleName) suggestions.push(`Add relevant ${roleName} certifications to strengthen your profile.`);
      else          suggestions.push('Add certifications: AWS, GCP, Azure, or technology-specific certs.');
    }
    if (actionVerbCount < 5)
      suggestions.push('Start every bullet with a strong action verb: Developed, Engineered, Optimized.');
    if (!hasProjectLinks)
      suggestions.push('Add GitHub/live demo links to your project entries.');
    if (missingContactInfo.length)
      suggestions.push(`Complete contact info — add: ${missingContactInfo.join(', ')}.`);
    if (keywordScore < 55)
      suggestions.push('Inject ATS keywords: Agile, CI/CD, REST API, microservices, unit testing.');
    if (suggestions.length === 0)
      suggestions.push('Your resume is well-optimized! Tailor it to each specific job description for best results.');

    // ── OPTIMIZED SCORES ─────────────────────────────────────────
    const boost = (current: number, factor: number) =>
      Math.min(100, Math.round(current + (100 - current) * factor));

    const optimizedStructureScore   = sections.summary ? boost(structureScore, 0.3) : boost(structureScore, 0.5);
    const optimizedSkillsScore      = boost(skillsScore, 0.22);
    const optimizedProjectsScore    = hasProjectLinks ? boost(projectsScore, 0.3) : boost(projectsScore, 0.5);
    const optimizedExperienceScore  = hasQuantifiedResults ? boost(experienceScore, 0.25) : boost(experienceScore, 0.55);
    const optimizedKeywordScore     = boost(keywordScore, 0.38);
    const optimizedContentScore     = boost(contentQualityScore, 0.45);
    const optimizedReadabilityScore = boost(readabilityScore, 0.18);

    const optimizedScore = Math.min(98, Math.round(
      optimizedStructureScore   * 0.18 +
      optimizedSkillsScore      * 0.22 +
      optimizedProjectsScore    * 0.15 +
      optimizedExperienceScore  * 0.20 +
      optimizedKeywordScore     * 0.12 +
      optimizedReadabilityScore * 0.07 +
      optimizedContentScore     * 0.06
    ));

    const atsIncrease         = optimizedScore - score;
    const readabilityIncrease = optimizedReadabilityScore - readabilityScore;
    const structureIncrease   = optimizedStructureScore - structureScore;
    const keywordsAdded       = Math.max(3, atsKeywords.length - atsMatches);
    const skillsAdded         = Math.max(2, missingSkills.length);

    // ── OPTIMIZED CONTENT ─────────────────────────────────────────
    const detectedRole = roleName ? roleName :
      (t.includes('frontend') || t.includes('react') || t.includes('vue') || t.includes('angular'))          ? 'Frontend Developer'
      : (t.includes('backend') || t.includes('node') || t.includes('django') || t.includes('spring'))        ? 'Backend Developer'
      : (t.includes('full stack') || t.includes('fullstack') || t.includes('full-stack'))                    ? 'Full Stack Developer'
      : (t.includes('machine learning') || t.includes('data science') || t.includes('tensorflow'))           ? 'Data / ML Engineer'
      : (t.includes('mobile') || t.includes('android') || t.includes('ios') || t.includes('flutter'))        ? 'Mobile Developer'
      : (t.includes('devops') || t.includes('cloud') || t.includes('aws') || t.includes('kubernetes'))       ? 'DevOps / Cloud Engineer'
      : (t.includes('security') || t.includes('cybersecurity'))                                              ? 'Security Engineer'
      : 'Software Engineer';

    const topSkills = foundSkillsList.slice(0, 6).map(s => s.toUpperCase()).join(', ') || 'JavaScript, Python, React, Node.js';
    const addSkills = missingSkills.slice(0, 3).join(', ') || 'Docker, AWS, PostgreSQL';
    const expContext = classification === 'Experienced'
      ? `${yearsExp}+ years of professional experience`
      : classification === 'Student' ? 'academic and project-based' : 'strong foundational and project-based';

    const optimizedContent: OptimizedContent = {
      summary: `Results-driven ${detectedRole} with ${expContext} experience designing and delivering high-performance, scalable applications. Expert in ${topSkills}${addSkills ? ` with growing proficiency in ${addSkills}` : ''}. Proven ability to collaborate with cross-functional teams, meet tight deadlines, and drive measurable business impact through clean, maintainable code.`,

      skills: [
        ...foundSkillsList.slice(0, 12).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        ...missingSkills.slice(0, 4).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        'Agile / Scrum', 'CI/CD Pipelines', 'REST APIs', 'Data Structures & Algorithms',
      ],

      projectHighlights: [
        `Engineered a full-stack web application using ${foundSkillsList[0] || 'React'} and ${foundSkillsList[1] || 'Node.js'}, achieving 40% reduction in page load time and supporting 5,000+ concurrent users; deployed on AWS with 99.9% uptime.`,
        `Designed and implemented an automated CI/CD pipeline using Docker and GitHub Actions, reducing deployment time from 45 minutes to under 8 minutes (82% improvement) and eliminating manual release errors.`,
        `Built a real-time ${detectedRole.includes('ML') || detectedRole.includes('Data') ? 'ML model serving' : 'data processing'} service handling 500+ requests/second with sub-100ms latency; integrated Redis caching to reduce database load by 60%.`,
        `Developed a responsive, WCAG 2.1-compliant UI using ${foundSkillsList.find(s => ['react','vue','angular','nextjs'].includes(s)) || 'React'}, improving user engagement by 35% and reducing bounce rate by 28%.`,
      ],

      experienceHighlights: [
        `Developed and maintained ${detectedRole} applications serving 10,000+ users, consistently achieving 99.9% uptime SLA.`,
        `Collaborated in an Agile team of 6–8 engineers using Scrum methodology, delivering 3 major product releases per quarter on schedule.`,
        `Optimized critical database query pipelines, reducing average API response time from 800ms to 95ms — an 88% performance improvement.`,
        `Led code review processes, improving team code quality scores by 40% and reducing production bug rate by 55%.`,
        `Implemented comprehensive unit and integration test suites (Jest, Pytest), increasing code coverage from 38% to 85% within 2 sprints.`,
      ],

      achievements: [
        `🏆 Reduced application load time by 40% through performance profiling, lazy loading, and code-splitting strategies`,
        `🚀 Delivered critical feature 2 weeks ahead of deadline, enabling early product launch that generated $120K in first-week revenue`,
        `⭐ Maintained 95%+ code review approval rate through clean, well-documented, and test-driven code across 50+ PRs`,
        `📈 Increased automated test coverage from 38% to 85%, reducing production bug reports by 55% in Q3`,
        `🎯 Recognized as top contributor for 2 consecutive quarters for implementing ${missingSkills[0] || 'Docker'}-based infrastructure upgrade`,
      ],
    };

    return {
      score,
      structureScore,
      skillsScore,
      projectsScore,
      experienceScore,
      contentQualityScore,
      readabilityScore,
      keywordScore,
      classification,
      missingContactInfo,
      missingKeywords,
      missingSkills,
      strengths,
      weaknesses,
      suggestions,
      filename,
      targetRole: targetRole || null,
      roleMatchLabel,
      optimizedScore,
      optimizedStructureScore,
      optimizedSkillsScore,
      optimizedProjectsScore,
      optimizedExperienceScore,
      optimizedKeywordScore,
      optimizedContentScore,
      optimizedReadabilityScore,
      keywordsAdded,
      skillsAdded,
      atsIncrease,
      readabilityIncrease,
      structureIncrease,
      aiInsights,
      optimizedContent,
    };
  }
}
