import { NextRequest, NextResponse } from 'next/server';
import { optimizeResume } from '@/lib/openai';
import { calculateATSScore } from '@/lib/ats';
import { JobAnalysis } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeContent, jobAnalysis, jobDescription } = body;

    if (!resumeContent || !jobAnalysis || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume content, job analysis, and job description are required' },
        { status: 400 }
      );
    }

    const optimization = await optimizeResume(
      resumeContent,
      jobAnalysis as JobAnalysis,
      jobDescription
    );

    // Calculate ATS score for both base and optimized resume
    const baseAtsScore = calculateATSScore(
      resumeContent,
      jobAnalysis as JobAnalysis
    );

    const optimizedAtsScore = calculateATSScore(
      optimization.optimizedContent,
      jobAnalysis as JobAnalysis
    );

    return NextResponse.json({
      optimization,
      baseAtsScore,
      optimizedAtsScore
    });
  } catch (error) {
    console.error('Error optimizing resume:', error);
    return NextResponse.json(
      { error: 'Failed to optimize resume' },
      { status: 500 }
    );
  }
}
