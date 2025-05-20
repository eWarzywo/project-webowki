import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';
import { addDays, addMonths, addYears } from 'date-fns';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to create chores' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        if (!session.user?.householdId) {
            return NextResponse.json({ message: 'You must be part of a household to create chores' }, { status: 401 });
        }

        const householdId = parseInt(session.user.householdId);

        const body = (await req.json()) as {
            name: string;
            dueDate: string;
            priority: number;
            cycle: number;
            repeatCount: number;
            description: string;
        };

        const newChore = await prisma.chore.create({
            data: {
                name: body.name,
                dueDate: new Date(body.dueDate),
                householdId: householdId,
                createdById: userId,
                priority: body.priority,
                cycle: body.cycle,
                repeatCount: body.repeatCount,
                description: body.description,
            },
        });

        if ((body.cycle > 0 || body.cycle == -30 || body.cycle == -365) && body.repeatCount > 0) {
            const childChores = [];
            const baseDate = new Date(body.dueDate);

            for (let i = 1; i <= body.repeatCount; i++) {
                let nextDate;

                if (body.cycle === -30) {
                    nextDate = addMonths(baseDate, i);
                } else if (body.cycle === -365) {
                    nextDate = addYears(baseDate, i);
                } else {
                    nextDate = addDays(baseDate, i * body.cycle);
                }

                childChores.push({
                    name: body.name,
                    dueDate: nextDate,
                    householdId: householdId,
                    createdById: userId,
                    priority: body.priority,
                    cycle: body.cycle,
                    repeatCount: 0,
                    description: body.description,
                    parentChoreId: newChore.id,
                });
            }

            await prisma.chore.createMany({
                data: childChores,
            });
        }

        const childChores = await prisma.chore.findMany({
            where: {
                parentChoreId: newChore.id,
            },
        });

        const completeChore = {
            ...newChore,
            childChores: childChores,
        };

        return NextResponse.json(completeChore, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}