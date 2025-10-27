import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Get all saved job applications for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        url: true,
        analysis: true,
        baseResumeContent: true,
        optimizedResumeContent: true,
        optimizedCoverLetterContent: true,
        baseAtsScore: true,
        optimizedAtsScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// Save a new job application
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const {
      title,
      company,
      description,
      url,
      analysis,
      baseResumeContent,
      optimizedResumeContent,
      optimizedCoverLetterContent,
      baseAtsScore,
      optimizedAtsScore,
    } = await req.json();

    if (!title || !company || !description) {
      return NextResponse.json(
        { error: 'Title, company, and description are required' },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        userId: user.id,
        title,
        company,
        description,
        url: url || null,
        analysis: analysis || null,
        baseResumeContent: baseResumeContent || null,
        optimizedResumeContent: optimizedResumeContent || null,
        optimizedCoverLetterContent: optimizedCoverLetterContent || null,
        baseAtsScore: baseAtsScore || null,
        optimizedAtsScore: optimizedAtsScore || null,
      },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        url: true,
        analysis: true,
        baseResumeContent: true,
        optimizedResumeContent: true,
        optimizedCoverLetterContent: true,
        baseAtsScore: true,
        optimizedAtsScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
