import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';
import prisma from '../../../../../libs/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                profilePicture: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ profilePicture: user.profilePicture }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch user profile picture:', error);
        return NextResponse.json({ error: 'Failed to fetch profile picture' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, profilePictureId } = await request.json();

        if (parseInt(session.user.id) !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                profilePictureId: profilePictureId === 0 ? null : profilePictureId,
            },
            select: {
                profilePicture: true,
            },
        });

        return NextResponse.json(
            {
                profilePicture: updatedUser.profilePicture,
                message: 'Profile picture updated successfully',
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Failed to update profile picture:', error);
        return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 });
    }
}
