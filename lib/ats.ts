import { JobAnalysis, KeywordData } from './openai';

export interface KeywordScore {
  keyword: KeywordData;
  resumeFrequency: number; // Percentage in resume
  relativeScore: number; // 0-100, how well resume matches JD frequency
  contextWeight: number; // 0.5 or 1.0 depending on where keyword appears
  contexts: string[]; // Where the keyword appears: 'experience', 'summary', 'skills'
  finalScore: number; // importance × relativeScore × contextWeight
}

export interface ATSScore {
  overall: number; // 0-100
  breakdown: {
    keywordMatch: number; // Now 70 points
    formatting: number; // Now 10 points
    length: number; // Now 10 points
    sections: number; // Now 10 points
  };
  recommendations: string[];
  matchedKeywords: string[]; // Kept for backward compatibility
  missingKeywords: string[]; // Kept for backward compatibility
  topKeywords: KeywordScore[]; // High-importance keywords (sorted by importance)
  otherKeywords: KeywordScore[]; // Lower-importance keywords
  detailedScores: KeywordScore[]; // All keywords with full details
}

/**
 * Helper function to count keyword occurrences in text
 */
function countKeywordOccurrences(text: string, keyword: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  const regex = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
  const matches = normalizedText.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Helper function to calculate word count (excluding stop words)
 */
function getWordCount(text: string): number {
  const stopWords = new Set(['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can']);
  const words = text.toLowerCase().split(/\s+/).filter(word =>
    word.length > 2 && !stopWords.has(word)
  );
  return words.length;
}

/**
 * Helper function to detect keyword contexts in resume
 */
function detectKeywordContexts(resumeContent: string, keyword: string): { contexts: string[]; contextWeight: number } {
  const normalizedContent = resumeContent.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  const contexts: string[] = [];

  // Split resume into sections
  const experienceMatch = normalizedContent.match(/experience.*?(?=education|skills|$)/s);
  const summaryMatch = normalizedContent.match(/(?:summary|about|profile).*?(?=experience|education|skills|$)/s);
  const skillsMatch = normalizedContent.match(/skills.*?(?=experience|education|$)/s);

  // Check if keyword appears in each section
  if (experienceMatch && experienceMatch[0].includes(normalizedKeyword)) {
    contexts.push('experience');
  }
  if (summaryMatch && summaryMatch[0].includes(normalizedKeyword)) {
    contexts.push('summary');
  }
  if (skillsMatch && skillsMatch[0].includes(normalizedKeyword)) {
    contexts.push('skills');
  }

  // Calculate context weight: 1.0 if in experience/summary, 0.5 if only in skills
  const hasHighContext = contexts.includes('experience') || contexts.includes('summary');
  const contextWeight = hasHighContext ? 1.0 : (contexts.includes('skills') ? 0.5 : 0);

  return { contexts, contextWeight };
}

/**
 * Calculates an ATS optimization score for a resume based on job requirements
 */
export function calculateATSScore(
  resumeContent: string,
  jobAnalysis: JobAnalysis,
  excludedKeywords: string[] = []
): ATSScore {
  const recommendations: string[] = [];
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const detailedScores: KeywordScore[] = [];

  // Normalize content for keyword matching
  const normalizedContent = resumeContent.toLowerCase();
  const resumeWordCount = getWordCount(resumeContent);

  // 1. Enhanced Keyword Match Score (70 points)
  // Filter out excluded keywords
  const allEnhancedKeywords = jobAnalysis.enhancedKeywords || [];
  const enhancedKeywords = allEnhancedKeywords.filter(
    kw => !excludedKeywords.includes(kw.term)
  );

  if (enhancedKeywords.length === 0) {
    // Fallback to old scoring if enhanced keywords not available
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
      ? (keywordMatches / allKeywords.length) * 70
      : 0;

    if (keywordScore < 42) {
      recommendations.push(
        `Add more relevant keywords. You're matching ${keywordMatches} of ${allKeywords.length} important keywords.`
      );
    }

    // Continue with old scoring for the rest...
    return calculateLegacyScore(resumeContent, jobAnalysis, keywordScore, recommendations, matchedKeywords, missingKeywords, excludedKeywords);
  }

  // Calculate score for each keyword
  let totalWeightedScore = 0;
  let totalImportance = 0;

  enhancedKeywords.forEach((keywordData) => {
    const occurrences = countKeywordOccurrences(resumeContent, keywordData.term);
    const resumeFrequency = resumeWordCount > 0 ? (occurrences / resumeWordCount) * 100 : 0;

    // Calculate relative frequency score (0-100)
    const relativeScore = keywordData.frequency > 0
      ? Math.min((resumeFrequency / keywordData.frequency) * 100, 100)
      : 0;

    // Detect context
    const { contexts, contextWeight } = detectKeywordContexts(resumeContent, keywordData.term);

    // Calculate final score contribution
    const finalScore = keywordData.importance * (relativeScore / 100) * contextWeight;

    // Track for backward compatibility
    if (occurrences > 0) {
      matchedKeywords.push(keywordData.term);
    } else {
      missingKeywords.push(keywordData.term);
    }

    // Store detailed score
    detailedScores.push({
      keyword: keywordData,
      resumeFrequency,
      relativeScore,
      contextWeight,
      contexts,
      finalScore,
    });

    totalWeightedScore += finalScore;
    totalImportance += keywordData.importance;
  });

  // Calculate normalized keyword score (0-70 points)
  const keywordScore = totalImportance > 0
    ? (totalWeightedScore / totalImportance) * 70
    : 0;

  // Generate recommendations for top missing keywords
  const missingHighImportance = detailedScores
    .filter(s => s.keyword.importance >= 2.0 && s.relativeScore < 50)
    .sort((a, b) => b.keyword.importance - a.keyword.importance)
    .slice(0, 5);

  if (missingHighImportance.length > 0) {
    recommendations.push(
      `High-priority keywords to add: ${missingHighImportance.map(s => s.keyword.term).join(', ')}`
    );
  }

  // Recommendations for underused keywords
  const underused = detailedScores
    .filter(s => s.relativeScore > 0 && s.relativeScore < 80 && s.keyword.importance >= 1.5)
    .sort((a, b) => b.keyword.importance - a.keyword.importance)
    .slice(0, 3);

  if (underused.length > 0) {
    recommendations.push(
      `Increase frequency of: ${underused.map(s => s.keyword.term).join(', ')}`
    );
  }

  // Recommendations for context improvement
  const needsContext = detailedScores
    .filter(s => s.contextWeight === 0.5 && s.keyword.importance >= 2.0)
    .slice(0, 3);

  if (needsContext.length > 0) {
    recommendations.push(
      `Use these keywords in Experience or Summary sections (not just Skills): ${needsContext.map(s => s.keyword.term).join(', ')}`
    );
  }

  // 2. Formatting Score (10 points)
  let formattingScore = 10;
  const formattingIssues: string[] = [];

  // Check for common ATS-unfriendly elements
  if (resumeContent.includes('|') || resumeContent.includes('•')) {
    formattingScore -= 1;
    formattingIssues.push('Consider using simple bullets (*) instead of special characters');
  }

  if (resumeContent.includes('\t')) {
    formattingScore -= 1;
    formattingIssues.push('Avoid using tabs; use spaces for indentation');
  }

  // Check for standard section headers
  const standardSections = ['experience', 'education', 'skills'];
  const foundSections = standardSections.filter((section) =>
    normalizedContent.includes(section)
  );

  if (foundSections.length < 2) {
    formattingScore -= 2;
    formattingIssues.push('Include standard section headers (Experience, Education, Skills)');
  }

  formattingScore = Math.max(0, formattingScore);

  if (formattingIssues.length > 0) {
    recommendations.push(...formattingIssues);
  }

  // 3. Length Score (10 points)
  const wordCount = resumeContent.split(/\s+/).length;
  let lengthScore = 10;

  if (wordCount < 200) {
    lengthScore = 4;
    recommendations.push('Resume is too short. Aim for 400-800 words for most positions.');
  } else if (wordCount < 300) {
    lengthScore = 6;
    recommendations.push('Consider adding more detail about your experience.');
  } else if (wordCount > 1000) {
    lengthScore = 7;
    recommendations.push('Resume may be too long. Try to keep it concise (400-800 words).');
  } else if (wordCount > 800) {
    lengthScore = 8.5;
  }

  // 4. Sections Score (10 points)
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
      sectionsScore += 2.5;
    } else {
      missingSections.push(section.name);
    }
  });

  if (missingSections.length > 0) {
    recommendations.push(
      `Add missing sections: ${missingSections.join(', ')}`
    );
  }

  // Calculate overall score (70 + 10 + 10 + 10 = 100)
  const overall = Math.round(
    keywordScore +
    formattingScore +
    lengthScore +
    sectionsScore
  );

  // Separate top keywords (importance >= 2.0) from other keywords
  const topKeywords = detailedScores
    .filter(s => s.keyword.importance >= 2.0)
    .sort((a, b) => b.keyword.importance - a.keyword.importance);

  const otherKeywords = detailedScores
    .filter(s => s.keyword.importance < 2.0)
    .sort((a, b) => b.keyword.importance - a.keyword.importance);

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
    topKeywords,
    otherKeywords,
    detailedScores,
  };
}

/**
 * Legacy scoring function for backward compatibility
 */
function calculateLegacyScore(
  resumeContent: string,
  jobAnalysis: JobAnalysis,
  keywordScore: number,
  recommendations: string[],
  matchedKeywords: string[],
  missingKeywords: string[],
  excludedKeywords: string[] = []
): ATSScore {
  const normalizedContent = resumeContent.toLowerCase();

  // Formatting (10 points)
  let formattingScore = 10;
  if (resumeContent.includes('|') || resumeContent.includes('•')) formattingScore -= 1;
  if (resumeContent.includes('\t')) formattingScore -= 1;

  // Length (10 points)
  const wordCount = resumeContent.split(/\s+/).length;
  let lengthScore = 10;
  if (wordCount < 200) lengthScore = 4;
  else if (wordCount < 300) lengthScore = 6;
  else if (wordCount > 1000) lengthScore = 7;
  else if (wordCount > 800) lengthScore = 8.5;

  // Sections (10 points)
  let sectionsScore = 0;
  const requiredSections = [
    { patterns: ['email', 'phone', 'linkedin'] },
    { patterns: ['experience', 'work history'] },
    { patterns: ['education', 'degree'] },
    { patterns: ['skills', 'technical skills'] },
  ];
  requiredSections.forEach((section) => {
    if (section.patterns.some((pattern) => normalizedContent.includes(pattern))) {
      sectionsScore += 2.5;
    }
  });

  return {
    overall: Math.round(keywordScore + formattingScore + lengthScore + sectionsScore),
    breakdown: {
      keywordMatch: Math.round(keywordScore),
      formatting: Math.round(formattingScore),
      length: Math.round(lengthScore),
      sections: Math.round(sectionsScore),
    },
    recommendations,
    matchedKeywords,
    missingKeywords,
    topKeywords: [],
    otherKeywords: [],
    detailedScores: [],
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
