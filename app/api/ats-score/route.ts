import { NextRequest, NextResponse } from 'next/server';
import { calculateATSScore } from '@/lib/ats';
import { JobAnalysis } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeContent, jobAnalysis } = body;

    if (!resumeContent || !jobAnalysis) {
      return NextResponse.json(
        { error: 'Resume content and job analysis are required' },
        { status: 400 }
      );
    }

    const atsScore = calculateATSScore(
      resumeContent,
      jobAnalysis as JobAnalysis
    );

    return NextResponse.json({ atsScore });
  } catch (error) {
    console.error('Error calculating ATS score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ATS score' },
      { status: 500 }
    );
  }
}
