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

        const profilePictures = await prisma.profilePicture.findMany({
            where: {},
            orderBy: {
                createdAt: 'asc',
            },
        });

        return NextResponse.json({ profilePictures }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch profile pictures:', error);
        return NextResponse.json({ error: 'Failed to fetch profile pictures' }, { status: 500 });
    }
}
