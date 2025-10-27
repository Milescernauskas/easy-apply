import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Get all cover letters for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        content: true,
        isOriginal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ coverLetters });
  } catch (error) {
    console.error('Get cover letters error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cover letters' },
      { status: 500 }
    );
  }
}

// Create a new cover letter
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { name, content, isOriginal } = await req.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: user.id,
        name,
        content,
        isOriginal: isOriginal || false,
      },
      select: {
        id: true,
        name: true,
        content: true,
        isOriginal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error('Create cover letter error:', error);
    return NextResponse.json(
      { error: 'Failed to create cover letter' },
      { status: 500 }
    );
  }
}
