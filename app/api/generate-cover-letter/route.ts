import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/openai';
import { JobAnalysis } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      originalCoverLetter,
      resumeContent,
      jobAnalysis,
      jobDescription,
      companyName,
      jobTitle,
    } = body;

    if (
      !originalCoverLetter ||
      !resumeContent ||
      !jobAnalysis ||
      !jobDescription ||
      !companyName ||
      !jobTitle
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const coverLetter = await generateCoverLetter(
      originalCoverLetter,
      resumeContent,
      jobAnalysis as JobAnalysis,
      jobDescription,
      companyName,
      jobTitle
    );

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
