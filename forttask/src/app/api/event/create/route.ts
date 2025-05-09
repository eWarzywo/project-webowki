import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to view events' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        if (!session.user?.householdId) {
            return NextResponse.json({ message: 'You must be part of a household to create events' }, { status: 401 });
        }

        const householdId = parseInt(session.user.householdId);

        const body = (await req.json()) as {
            name: string;
            description?: string;
            date: string;
            attendees: number[];
        };

        const newEvent = await prisma.event.create({
            data: {
                name: body.name,
                description: body.description || '',
                date: new Date(body.date),
                householdId: householdId,
                createdById: userId,
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