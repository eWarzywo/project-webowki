import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    const user = await prisma.user.findUnique({
      where: {
        email: userEmail as string,
      },
      include: {
        profilePicture: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.profilePicture) {
      return NextResponse.json({
        profilePicture: user.profilePicture
      }, { status: 200 });
    } else {
      return NextResponse.json({
        profilePicture: null
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
      include: {
        profilePicture: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profilePicture: user.profilePicture
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching profile picture by userId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}