import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';
import { addDays, addMonths, addYears } from 'date-fns';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to create events' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        if (!session.user?.householdId) {
            return NextResponse.json(
                { message: 'You must be a part of a household to create events' },
                { status: 401 },
            );
        }

        const householdId = parseInt(session.user.householdId);

        const body = (await req.json()) as {
            name: string;
            description: string;
            date: string;
            attendees: number[];
            location: string;
            repeat: number;
            repeatCount: number;
        };

        const newEvent = await prisma.event.create({
            data: {
                name: body.name,
                description: body.description,
                date: new Date(body.date),
                householdId: householdId,
                createdById: userId,
                location: body.location,
                cycle: body.repeat,
                repeatCount: body.repeatCount,
                attendees: {
                    create: body.attendees.map((userId) => ({
                        user: { connect: { id: userId } },
                    })),
                },
            },
            include: { attendees: { include: { user: true } } },
        });

        if ((body.repeat > 0 || body.repeat == -30 || body.repeat == -365) && body.repeatCount > 0) {
            const childEvents = [];
            const baseDate = new Date(body.date);

            for (let i = 1; i <= body.repeatCount; i++) {
                let nextDate;

                if (body.repeat === -30) {
                    nextDate = addMonths(baseDate, i);
                } else if (body.repeat === -365) {
                    nextDate = addYears(baseDate, i);
                } else {
                    nextDate = addDays(baseDate, body.repeat * i);
                }

                childEvents.push({
                    name: body.name,
                    description: body.description,
                    date: nextDate,
                    householdId: householdId,
                    createdById: userId,
                    location: body.location,
                    cycle: body.repeat,
                    repeatCount: 0,
                    parentEventId: newEvent.id,
                });
            }

            if (childEvents.length > 0) {
                await prisma.event.createMany({
                    data: childEvents,
                });

                const childEventRecords = await prisma.event.findMany({
                    where: {
                        parentEventId: newEvent.id,
                    },
                });

                for (const event of childEventRecords) {
                    await prisma.eventAttendee.createMany({
                        data: body.attendees.map((userId) => ({
                            eventId: event.id,
                            userId: userId,
                        })),
                    });
                }
            }
        }

        const childEvents = await prisma.event.findMany({
            where: {
                parentEventId: newEvent.id,
            },
            include: {
                attendees: { include: { user: true } },
            },
        });

        const completeEvent = {
            ...newEvent,
            childEvents: childEvents,
        };

        return NextResponse.json(completeEvent, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
