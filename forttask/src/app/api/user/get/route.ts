import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(session.user.id),
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}