import { JobAnalysis } from './openai';

export interface ATSScore {
  overall: number; // 0-100
  breakdown: {
    keywordMatch: number;
    formatting: number;
    length: number;
    sections: number;
  };
  recommendations: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

/**
 * Calculates an ATS optimization score for a resume based on job requirements
 */
export function calculateATSScore(
  resumeContent: string,
  jobAnalysis: JobAnalysis
): ATSScore {
  const recommendations: string[] = [];
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  // Normalize content for keyword matching
  const normalizedContent = resumeContent.toLowerCase();

  // 1. Keyword Match Score (40% of total)
  const allKeywords = [
    ...jobAnalysis.keySkills,
    ...jobAnalysis.keywords,
    ...jobAnalysis.requiredQualifications,
  ];

  let keywordMatches = 0;
  allKeywords.forEach((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    if (normalizedContent.includes(normalizedKeyword)) {
      keywordMatches++;
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  const keywordScore = allKeywords.length > 0
    ? (keywordMatches / allKeywords.length) * 100
    : 0;

  if (keywordScore < 60) {
    recommendations.push(
      `Add more relevant keywords. You're matching ${keywordMatches} of ${allKeywords.length} important keywords.`
    );
  }

  // 2. Formatting Score (20% of total)
  let formattingScore = 100;
  const formattingIssues: string[] = [];

  // Check for common ATS-unfriendly elements
  if (resumeContent.includes('|') || resumeContent.includes('•')) {
    formattingScore -= 10;
    formattingIssues.push('Consider using simple bullets (*) instead of special characters');
  }

  if (resumeContent.includes('\t')) {
    formattingScore -= 10;
    formattingIssues.push('Avoid using tabs; use spaces for indentation');
  }

  // Check for standard section headers
  const standardSections = ['experience', 'education', 'skills'];
  const foundSections = standardSections.filter((section) =>
    normalizedContent.includes(section)
  );

  if (foundSections.length < 2) {
    formattingScore -= 20;
    formattingIssues.push('Include standard section headers (Experience, Education, Skills)');
  }

  if (formattingIssues.length > 0) {
    recommendations.push(...formattingIssues);
  }

  // 3. Length Score (15% of total)
  const wordCount = resumeContent.split(/\s+/).length;
  let lengthScore = 100;

  if (wordCount < 200) {
    lengthScore = 40;
    recommendations.push('Resume is too short. Aim for 400-800 words for most positions.');
  } else if (wordCount < 300) {
    lengthScore = 60;
    recommendations.push('Consider adding more detail about your experience.');
  } else if (wordCount > 1000) {
    lengthScore = 70;
    recommendations.push('Resume may be too long. Try to keep it concise (400-800 words).');
  } else if (wordCount > 800) {
    lengthScore = 85;
  }

  // 4. Sections Score (25% of total)
  let sectionsScore = 0;
  const requiredSections = [
    { name: 'Contact', patterns: ['email', 'phone', 'linkedin'] },
    { name: 'Experience', patterns: ['experience', 'work history', 'employment'] },
    { name: 'Education', patterns: ['education', 'degree', 'university', 'college'] },
    { name: 'Skills', patterns: ['skills', 'technical skills', 'competencies'] },
  ];

  const missingSections: string[] = [];
  requiredSections.forEach((section) => {
    const hasSection = section.patterns.some((pattern) =>
      normalizedContent.includes(pattern.toLowerCase())
    );
    if (hasSection) {
      sectionsScore += 25;
    } else {
      missingSections.push(section.name);
    }
  });

  if (missingSections.length > 0) {
    recommendations.push(
      `Add missing sections: ${missingSections.join(', ')}`
    );
  }

  // Calculate overall score with weights
  const overall = Math.round(
    keywordScore * 0.4 +
    formattingScore * 0.2 +
    lengthScore * 0.15 +
    sectionsScore * 0.25
  );

  // Add missing keyword recommendations (top 5)
  if (missingKeywords.length > 0) {
    const topMissing = missingKeywords.slice(0, 5);
    recommendations.push(
      `Consider incorporating these keywords: ${topMissing.join(', ')}`
    );
  }

  return {
    overall,
    breakdown: {
      keywordMatch: Math.round(keywordScore),
      formatting: Math.round(formattingScore),
      length: Math.round(lengthScore),
      sections: Math.round(sectionsScore),
    },
    recommendations,
    matchedKeywords,
    missingKeywords,
  };
}

/**
 * Provides simple text-based formatting suggestions for ATS compatibility
 */
export function formatForATS(content: string): string {
  let formatted = content;

  // Replace tabs with spaces
  formatted = formatted.replace(/\t/g, '  ');

  // Replace fancy bullets with simple ones
  formatted = formatted.replace(/•/g, '*');
  formatted = formatted.replace(/◦/g, '-');
  formatted = formatted.replace(/▪/g, '*');

  // Remove excessive whitespace
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Ensure section headers are clear
  formatted = formatted.replace(/EXPERIENCE:/gi, 'EXPERIENCE\n');
  formatted = formatted.replace(/EDUCATION:/gi, 'EDUCATION\n');
  formatted = formatted.replace(/SKILLS:/gi, 'SKILLS\n');

  return formatted;
}
