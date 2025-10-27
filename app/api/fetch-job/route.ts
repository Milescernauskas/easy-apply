import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';

const MODEL = process.env.AI_MODEL || 'openai/gpt-5';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch the job posting page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch job posting' },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Use GPT-5 to extract job details from the HTML
    const { text } = await generateText({
      model: MODEL,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured job information from HTML job postings. Extract the job title, company name, and full job description. Return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: `Extract the job title, company name, and job description from this HTML.

For the description field, combine ALL job-related information from the page into one comprehensive text, including: overview, responsibilities, requirements (required and preferred), qualifications, skills, benefits, company info, location, salary, and any other job details found anywhere on the page. Do not limit yourself to only sections labeled "job description" - gather all relevant content.

Return the result as JSON with fields: title, company, and description.

HTML:\n${html.slice(0, 100030)}`, // Increased limit to capture more content
        },
      ],
    });

    const jobData = JSON.parse(text);

    return NextResponse.json({
      title: jobData.title || '',
      company: jobData.company || '',
      description: jobData.description || '',
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to parse job posting. Please try entering details manually.' },
      { status: 500 }
    );
  }
}
