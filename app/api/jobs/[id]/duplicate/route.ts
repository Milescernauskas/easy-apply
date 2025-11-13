import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Find the job to duplicate
    const existingJob = await prisma.job.findUnique({
      where: {
        id,
        userId: user.id, // Ensure user can only duplicate their own jobs
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Create a duplicate job with the same data
    const duplicatedJob = await prisma.job.create({
      data: {
        userId: user.id,
        title: `${existingJob.title} (Copy)`,
        company: existingJob.company,
        description: existingJob.description,
        url: existingJob.url,
        analysis: existingJob.analysis,
        excludedKeywords: existingJob.excludedKeywords,
        baseResumeContent: existingJob.baseResumeContent,
        optimizedResumeContent: existingJob.optimizedResumeContent,
        optimizedCoverLetterContent: existingJob.optimizedCoverLetterContent,
        baseAtsScore: existingJob.baseAtsScore,
        optimizedAtsScore: existingJob.optimizedAtsScore,
      },
    });

    return NextResponse.json({ job: duplicatedJob });
  } catch (error) {
    console.error('Duplicate job error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate job' },
      { status: 500 }
    );
  }
}
