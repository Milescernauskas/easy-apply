import { generateText } from 'ai';

if (!process.env.AI_GATEWAY_API_KEY) {
  throw new Error('Missing AI_GATEWAY_API_KEY environment variable');
}

// Configure the model to use
// Options: 'openai/gpt-5', 'openai/gpt-4.1', 'openai/gpt-4-turbo', etc.
const MODEL = process.env.AI_MODEL || 'openai/gpt-5';

export interface JobAnalysis {
  keySkills: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  companyValues: string[];
  keywords: string[];
  experienceLevel: string;
  summary: string;
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
  const prompt = `Analyze the following job description and extract key information that would be useful for optimizing a resume and cover letter.

Job Description:
${jobDescription}

Please provide:
1. Key skills mentioned (technical and soft skills)
2. Required qualifications
3. Preferred qualifications
4. Company values or culture indicators
5. Important keywords for ATS
6. Experience level required
7. A brief summary

Return your response as a JSON object with the following structure:
{
  "keySkills": ["skill1", "skill2", ...],
  "requiredQualifications": ["qual1", "qual2", ...],
  "preferredQualifications": ["qual1", "qual2", ...],
  "companyValues": ["value1", "value2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "experienceLevel": "junior/mid/senior/executive",
  "summary": "brief summary of the role"
}`;

  const { text } = await generateText({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert career counselor and ATS optimization specialist. Analyze job descriptions and provide actionable insights for job seekers. Always respond with valid JSON only.',
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
  const prompt = `You are helping a job seeker optimize their resume for a specific job application.

Original Resume:
${resumeContent}

Job Description:
${jobDescription}

Key Skills Required: ${jobAnalysis.keySkills.join(', ')}
Required Qualifications: ${jobAnalysis.requiredQualifications.join(', ')}
Important Keywords: ${jobAnalysis.keywords.join(', ')}

Please optimize the resume to:
1. Highlight relevant experience that matches the job requirements
2. Incorporate important keywords naturally (for ATS)
3. Reorder or emphasize sections that align with the job
4. Ensure achievements are quantifiable where possible
5. Match the experience level and tone to the job posting
6. Maintain truthfulness - only emphasize existing skills and experience

Return your response as a JSON object with:
{
  "optimizedContent": "the full optimized resume text",
  "changes": [
    {
      "section": "section name",
      "original": "original text",
      "modified": "modified text",
      "reason": "why this change was made"
    }
  ],
  "suggestions": ["additional suggestions for the applicant"]
}`;

  const { text } = await generateText({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert resume writer and career counselor with deep knowledge of ATS systems and hiring practices. Always respond with valid JSON only.',
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
  const prompt = `You are helping a job seeker create a highly tailored cover letter for a specific job application.

Original Cover Letter (use this to understand the author's voice and style):
${originalCoverLetter}

Resume:
${resumeContent}

Job Title: ${jobTitle}
Company: ${companyName}

Job Description:
${jobDescription}

Key Skills Required: ${jobAnalysis.keySkills.join(', ')}
Company Values: ${jobAnalysis.companyValues.join(', ')}

Your task is to rewrite the cover letter to align with this specific role while maintaining the author's authentic voice:

1. **Preserve the author's voice**: Match the writing style, tone, sentence structure, and personality from the original letter. If they use contractions, you use contractions. If they're formal, stay formal. If they're conversational, stay conversational.

2. **Tailor the content**: Rewrite the body paragraphs to directly address this specific job:
   - Lead with the most relevant experiences from the resume that match the job requirements
   - Weave in 4-6 of the key skills naturally throughout the letter
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
