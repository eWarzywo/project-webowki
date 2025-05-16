import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../../libs/prisma';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { authOptions } from '../../../auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { household: true }
        });

        if (!user || !user.householdId) {
            return NextResponse.json({ error: 'User not in a household' }, { status: 404 });
        }

        const date = dateParam ? new Date(dateParam) : new Date();
        const oneWeekLater = addDays(date, 7);

        let dateFilter = {
            dueDate: {
                gte: startOfDay(date),
                lte: endOfDay(oneWeekLater)
            }
        };

        const chores = await prisma.chore.findMany({
            where: {
                householdId: user.householdId,
                doneById: null,
                ...dateFilter
            },
            select: {
                id: true,
                name: true,
                description: true,
                dueDate: true,
                priority: true,
                createdBy: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: [
                { dueDate: 'asc' },
                { priority: 'desc' }
            ],
            take: 5
        });

        return NextResponse.json({ chores });
    } catch (error) {
        console.error('Error fetching chores:', error);
        return NextResponse.json({ error: 'Failed to fetch chores' }, { status: 500 });
    }
}