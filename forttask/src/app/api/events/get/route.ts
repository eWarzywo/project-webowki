import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to view events' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        if (!session.user?.householdId) {
            return NextResponse.json({ message: 'You must be a part of a household to view events' }, { status: 401 });
        }

        const url = new URL(req.url);
        const searchParams = url.searchParams;
        const date = searchParams.get('date');
        const dateObj = date ? new Date(date) : false;

        const limitParam = searchParams.get('limit');
        const skipParam = searchParams.get('skip');

        const limit = limitParam ? parseInt(limitParam, 10) : undefined;
        const skip = skipParam ? parseInt(skipParam, 10) : undefined;

        const whereClause = {
            attendees: {
                some: { userId: userId },
            },
            ...(dateObj && {
                date: {
                    gte: new Date(new Date(dateObj).setHours(0, 0, 0, 0)),
                    lte: new Date(new Date(dateObj).setHours(23, 59, 59, 999)),
                },
            }),
        };

        const count = await prisma.event.count({
            where: whereClause,
        });

        const events = await prisma.event.findMany({
            where: whereClause,
            include: { attendees: { include: { user: true } } },
            ...(skip !== undefined && { skip }),
            ...(limit !== undefined && { take: limit }),
        });

        return NextResponse.json({ events, count });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
