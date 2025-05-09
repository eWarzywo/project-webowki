import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to view events' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const url = new URL(req.url)
        const searchParams = url.searchParams;
        const date = searchParams.get('date');
        const dateObj = date ? new Date(date) : false;

        let events;

        if (!dateObj) {
            events = await prisma.event.findMany({
                where: {
                    attendees: {
                        some: { userId: userId },
                    },
                },
                include: { attendees: { include: { user: true } } },
            });
        } else {
            events = await prisma.event.findMany({
                where: {
                    attendees: {
                        some: { userId: userId },
                    },
                    date: {
                        gte: new Date(dateObj.setHours(0, 0, 0, 0)),
                        lte: new Date(dateObj.setHours(23, 59, 59, 999)),
                    },
                },
                include: { attendees: { include: { user: true } } },
            });
        }

        return NextResponse.json(events);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}