import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to delete events' }, { status: 401 });
        }

        const householdId = session.user.householdId ? parseInt(session.user.householdId) : null;

        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 });
        }

        if (isNaN(parseInt(eventId))) {
            return NextResponse.json({ error: 'Invalid eventId parameter' }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { id: parseInt(eventId) }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (event.householdId !== householdId) {
            return NextResponse.json({ error: 'Not authorized to delete this event' }, { status: 403 });
        }

        await prisma.event.delete({
            where: { id: parseInt(eventId) },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}