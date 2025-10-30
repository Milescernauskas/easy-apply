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

    // Get excluded keywords from database if jobId is provided
    let excludedKeywords: string[] = [];
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: {
          id: jobId,
          userId: user.id,
        },
        select: {
          excludedKeywords: true,
        },
      });
      excludedKeywords = job?.excludedKeywords || [];
    }

    // Calculate new ATS score with excluded keywords
    const newAtsScore = calculateATSScore(optimizedResumeContent, jobAnalysis, excludedKeywords);

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
