import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
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

    const job = await prisma.job.findUnique({
      where: {
        id,
        userId: user.id, // Ensure user can only access their own jobs
      },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        url: true,
        analysis: true,
        excludedKeywords: true,
        baseResumeContent: true,
        optimizedResumeContent: true,
        optimizedCoverLetterContent: true,
        baseAtsScore: true,
        optimizedAtsScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// Update a job application
export async function PATCH(
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
    const body = await req.json();

    // Verify the job belongs to the user
    const existingJob = await prisma.job.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Update the job
    const job = await prisma.job.update({
      where: {
        id,
      },
      data: body,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
