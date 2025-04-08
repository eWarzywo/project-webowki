import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            name: string;
            description?: string;
            date: string;
            attendees: number[];
            householdId: number;
            createdById: number;
        };

        const newEvent = await prisma.event.create({
            data: {
                name: body.name,
                description: body.description || '',
                date: new Date(body.date),
                householdId: body.householdId,
                createdById: body.createdById,
                attendees: {
                    create: body.attendees.map((userId) => ({
                        user: { connect: { id: userId } },
                    })),
                },
            },
            include: { attendees: { include: { user: true } } },
        });

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
        }

        if (isNaN(parseInt(userId))) {
            return NextResponse.json({ error: 'Invalid userId parameter' }, { status: 400 });
        }

        const events = await prisma.event.findMany({
            where: {
                attendees: {
                    some: { userId: parseInt(userId) },
                },
            },
            include: { attendees: { include: { user: true } } },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 });
        }

        if (isNaN(parseInt(eventId))) {
            return NextResponse.json({ error: 'Invalid eventId parameter' }, { status: 400 });
        }

        await prisma.event.delete({
            where: { id: parseInt(eventId) },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}