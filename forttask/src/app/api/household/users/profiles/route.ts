import { NextResponse } from 'next/server';
import prisma from '../../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const householdId = searchParams.get('householdId');

        if (!householdId) {
            return NextResponse.json({ message: 'Missing householdId parameter' }, { status: 400 });
        }

        if (isNaN(Number(householdId))) {
            return NextResponse.json({ message: 'Invalid householdId parameter' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: {
                householdId: parseInt(householdId),
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
            },
        });

        const usersWithProfiles = users.map((user) => ({
            ...user,
            profilePicture: user.profilePicture || {
                id: 0,
                name: 'Default Avatar',
                imageUrl: '/images/avatars/defaultAvatar.png',
                category: 'default',
            },
        }));

        return NextResponse.json(usersWithProfiles);
    } catch (error) {
        console.error('Error fetching household user profiles:', error);
        return NextResponse.json({ error: 'Failed to fetch household user profiles' }, { status: 500 });
    }
}
