import { generateText } from 'ai';

if (!process.env.AI_GATEWAY_API_KEY) {
  throw new Error('Missing AI_GATEWAY_API_KEY environment variable');
}

// Configure the model to use
// Options: 'openai/gpt-5', 'openai/gpt-4.1', 'openai/gpt-4-turbo', etc.
const MODEL = process.env.AI_MODEL || 'openai/gpt-5';

export interface KeywordData {
  term: string;
  frequency: number; // Percentage of total words in the section
  section: string; // Which section this keyword appeared in
  sectionType: 'required' | 'preferred' | 'general'; // Type of section
  importance: number; // frequency × section multiplier
}

export interface JobAnalysis {
  keySkills: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  companyValues: string[];
  keywords: string[]; // Kept for backward compatibility
  enhancedKeywords: KeywordData[]; // New enhanced keyword data
  coreTechnicalSkills: string[]; // Focused list of most relevant technical skills
  experienceLevel: string;
  summary: string;
  excludedKeywords?: string[]; // Keywords user has manually removed
}

export interface ResumeOptimization {
  optimizedContent: string;
  changes: {
    section: string;
    original: string;
    modified: string;
    reason: string;
  }[];
  suggestions: string[];
}

export interface CoverLetterGeneration {
  content: string;
  keyPoints: string[];
}

export async function analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
  const prompt = `Analyze the following job description and extract key information for ATS optimization.

Job Description:
${jobDescription}

IMPORTANT: Extract ONLY relevant technical and soft skills. Apply strict filtering rules.

Section Categories:
- HIGH-PRIORITY (multiplier 2.0x): "must-have requirements", "required qualifications", "requirements", "required technical skills", "must haves", "required skills", "minimum qualifications"
- MEDIUM-PRIORITY (multiplier 1.0x): "responsibilities", "about the role", "what you'll do", general description text without specific section headers
- LOW-PRIORITY (multiplier 0.3x): "nice-to-have", "additional requirements", "bonus points", "preferred requirements", "preferred qualifications", "plus if you have"

KEYWORD FILTERING RULES - ONLY INCLUDE RELEVANT SKILLS:

✅ INCLUDE (these are valid keywords):
- Programming Languages: Python, JavaScript, TypeScript, Ruby, Go, Java, C++, C#, PHP, Swift, Kotlin, Rust, etc.
- Frameworks/Libraries: React, Angular, Vue, Rails, Django, Flask, Express, Spring Boot, .NET, Laravel, etc.
- Databases: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, DynamoDB, Cassandra, etc.
- DevOps/Tools: Git, Docker, Kubernetes, Jenkins, CircleCI, Terraform, Ansible, etc.
- Cloud Platforms: AWS, Azure, GCP, Lambda, S3, EC2, CloudFormation, etc.
- Testing: Jest, Pytest, RSpec, Selenium, Cypress, JUnit, etc.
- Methodologies: Agile, Scrum, TDD, BDD, CI/CD, Microservices, REST API, GraphQL, etc.
- Soft Skills: Leadership, Communication, Problem-solving, Collaboration, Mentoring, etc.
- Certifications: AWS Certified, PMP, Scrum Master, etc.

❌ EXCLUDE (do NOT include these as keywords):
- Company/Product Names: Planning Center, Salesforce, Church Center, etc. (unless asking for experience WITH the platform as a skill)
- Team Names: Chat team, Support team, Engineering team, Cross-functional team, etc.
- Generic Phrases: New features, Customer data, Technical specifications, Web and mobile, etc.
- Job Characteristics: Remote work, On-site, Hybrid, Travel requirements, Work schedule, etc.
- Location/Visa: United States, California, H-1B visas, Remote, etc.
- Experience Requirements: 4+ years, 5 years, Junior, Senior, Mid-level, etc. (extract separately)
- Company Benefits: Health insurance, 401k, PTO, etc.
- Generic Verbs: Building, Creating, Developing, Working with (unless part of a technical term)

For keyword extraction:
1. Identify section headers and categorize them as high/medium/low priority
2. Extract ONLY technical skills, tools, methodologies, and soft skills
3. Extract both single-word keywords AND multi-word phrases (2-3 word technical terms)
4. Calculate keyword frequency as percentage of total words in that section (excluding stop words)
5. Calculate importance = frequency × section_multiplier
6. Extract 15-30 RELEVANT keywords only
7. Also extract a focused list of the top 10-15 "coreTechnicalSkills" - the most critical technical skills for this role

Return your response as a JSON object with the following structure:
{
  "keySkills": ["skill1", "skill2", ...],
  "requiredQualifications": ["qual1", "qual2", ...],
  "preferredQualifications": ["qual1", "qual2", ...],
  "companyValues": ["value1", "value2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "coreTechnicalSkills": ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", ...],
  "enhancedKeywords": [
    {
      "term": "React",
      "frequency": 3.0,
      "section": "Required Technical Skills",
      "sectionType": "required",
      "importance": 6.0
    },
    {
      "term": "TypeScript",
      "frequency": 2.5,
      "section": "Required Technical Skills",
      "sectionType": "required",
      "importance": 5.0
    },
    {
      "term": "GraphQL",
      "frequency": 1.5,
      "section": "Nice-to-have",
      "sectionType": "preferred",
      "importance": 0.45
    }
  ],
  "experienceLevel": "junior/mid/senior/executive",
  "summary": "brief summary of the role"
}`;

  const { text } = await generateText({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert career counselor and ATS optimization specialist with deep knowledge of how modern Applicant Tracking Systems score resumes using keyword frequency analysis and section-aware importance weighting. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  return JSON.parse(text) as JobAnalysis;
}

export async function optimizeResume(
  resumeContent: string,
  jobAnalysis: JobAnalysis,
  jobDescription: string
): Promise<ResumeOptimization> {
  // Prepare keyword data for optimization
  const enhancedKeywords = jobAnalysis.enhancedKeywords || [];
  const topKeywords = enhancedKeywords
    .filter(k => k.importance >= 2.0)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);

  const keywordList = topKeywords.map(k =>
    `- "${k.term}" (importance: ${k.importance.toFixed(1)}, target frequency: ${k.frequency.toFixed(1)}%, from ${k.section})`
  ).join('\n');

  const prompt = `You are helping a job seeker optimize their resume for a specific job application using advanced ATS optimization.

Original Resume:
${resumeContent}

Job Description:
${jobDescription}

CRITICAL ATS OPTIMIZATION INSTRUCTIONS:

Modern ATS systems score resumes based on:
1. Keyword frequency matching (must match or exceed job description frequency)
2. Context weighting (keywords in Experience/Summary sections score 2x higher than Skills section)
3. Section-aware importance (keywords from "required" sections are weighted higher)

TOP PRIORITY KEYWORDS (from required qualifications):
${keywordList}

OPTIMIZATION STRATEGY:
1. **Frequency Targeting**: For each top keyword, aim to match or exceed the target frequency percentage
   - If a keyword appears 3% in the JD, it should appear ~3% in the resume
   - Repeat important keywords 2-4 times naturally across different bullets

2. **Context Optimization**: Prioritize using keywords in:
   - Experience section bullets (weight: 1.0)
   - Professional Summary section (weight: 1.0)
   - Skills section only as backup (weight: 0.5)

3. **Natural Integration**:
   - Weave keywords into contextual sentences describing actual accomplishments
   - Use variations and related terms naturally
   - Never just list keywords - always use in full sentences

4. **Priority System**:
   - Focus on high-importance keywords (>= 2.0) first
   - Required qualification keywords are most critical
   - Nice-to-have keywords are lowest priority

5. **Truthfulness**: Only emphasize existing skills and experience - never fabricate

EXAMPLE:
Instead of: "Skills: Product Management, Analytics, JIRA"
Better: "Led cross-functional product management initiatives, leveraging analytics tools and JIRA to optimize team workflows. Managed product roadmap using data-driven analytics to inform product management decisions."

Return your response as a JSON object with:
{
  "optimizedContent": "the full optimized resume text with enhanced keyword frequency and context",
  "changes": [
    {
      "section": "section name",
      "original": "original text",
      "modified": "modified text",
      "reason": "why this change was made (reference keyword frequency/context)"
    }
  ],
  "suggestions": ["additional suggestions for the applicant"]
}`;

  const { text } = await generateText({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert resume writer and ATS optimization specialist with deep knowledge of how modern Applicant Tracking Systems use frequency-based keyword scoring and context weighting. You understand that keywords in Experience/Summary sections score higher than Skills sections. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
  });

  return JSON.parse(text) as ResumeOptimization;
}

export async function generateCoverLetter(
  originalCoverLetter: string,
  resumeContent: string,
  jobAnalysis: JobAnalysis,
  jobDescription: string,
  companyName: string,
  jobTitle: string
): Promise<CoverLetterGeneration> {
  // Get top priority keywords for cover letter
  const enhancedKeywords = jobAnalysis.enhancedKeywords || [];
  const topKeywords = enhancedKeywords
    .filter(k => k.importance >= 2.0)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8)
    .map(k => k.term);

  const prompt = `You are helping a job seeker create a highly tailored cover letter for a specific job application.

Original Cover Letter (use this to understand the author's voice and style):
${originalCoverLetter}

Resume:
${resumeContent}

Job Title: ${jobTitle}
Company: ${companyName}

Job Description:
${jobDescription}

High-Priority Keywords (from required qualifications): ${topKeywords.join(', ')}
Key Skills Required: ${jobAnalysis.keySkills.join(', ')}
Company Values: ${jobAnalysis.companyValues.join(', ')}

Your task is to rewrite the cover letter to align with this specific role while maintaining the author's authentic voice:

1. **Preserve the author's voice**: Match the writing style, tone, sentence structure, and personality from the original letter. If they use contractions, you use contractions. If they're formal, stay formal. If they're conversational, stay conversational.

2. **Tailor the content**: Rewrite the body paragraphs to directly address this specific job:
   - Lead with the most relevant experiences from the resume that match the job requirements
   - Naturally incorporate 5-7 high-priority keywords in contextual sentences (NOT just listing them)
   - Reference 2-3 company values and explain why they resonate with you
   - Use specific examples that demonstrate you understand the role's challenges and requirements

3. **Make it compelling and specific**:
   - Show genuine enthusiasm for THIS specific role and company
   - Connect your past achievements to what this job needs
   - Demonstrate you've researched the company (based on values provided)
   - Make every paragraph relevant to this opportunity

4. **Structure flexibility**: You can reorganize paragraphs or add/remove content as needed to create the strongest possible narrative for this specific role. Don't feel constrained by the original structure.

5. **Length**: Aim for 3-4 substantial paragraphs. Quality over strict length matching.

The goal: Someone reading this should think "This person really wants THIS job at THIS company" while also thinking "This sounds like the authentic voice of the candidate."

Return your response as a JSON object with:
{
  "content": "the full tailored cover letter text",
  "keyPoints": ["key tailoring done 1", "key tailoring done 2", "key tailoring done 3"]
}`;

  const { text } = await generateText({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert cover letter writer who creates highly tailored, compelling cover letters that match the candidate\'s authentic voice while demonstrating perfect alignment with specific job opportunities. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  return JSON.parse(text) as CoverLetterGeneration;
}
