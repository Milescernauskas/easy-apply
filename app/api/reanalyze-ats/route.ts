import { NextRequest, NextResponse } from 'next/server';
import { calculateATSScore } from '@/lib/ats';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { jobId, optimizedResumeContent, jobDescription, jobAnalysis } = await req.json();

    if (!optimizedResumeContent || !jobDescription || !jobAnalysis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate new ATS score
    const newAtsScore = calculateATSScore(optimizedResumeContent, jobAnalysis, jobDescription);

    // If jobId is provided, update the database
    if (jobId) {
      await prisma.job.update({
        where: {
          id: jobId,
          userId: user.id,
        },
        data: {
          optimizedAtsScore: newAtsScore as any,
        },
      });
    }

    return NextResponse.json({ atsScore: newAtsScore });
  } catch (error) {
    console.error('Re-analyze ATS error:', error);
    return NextResponse.json(
      { error: 'Failed to re-analyze resume' },
      { status: 500 }
    );
  }
}
