import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../libs/prisma';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { authOptions } from '../../auth';

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
            include: { household: true },
        });

        if (!user || !user.householdId) {
            return NextResponse.json({ error: 'User not in a household' }, { status: 404 });
        }

        const date = dateParam ? new Date(dateParam) : new Date();
        const oneWeekLater = addDays(date, 7);

        const eventsFilter = {
            date: {
                gte: startOfDay(date),
                lte: endOfDay(oneWeekLater),
            },
        };

        const choresFilter = {
            dueDate: {
                gte: startOfDay(date),
                lte: endOfDay(oneWeekLater),
            },
        };

        const billsFilter = {
            dueDate: {
                gte: startOfDay(date),
                lte: endOfDay(oneWeekLater),
            },
        };

        const shoppingFilter = {
            createdAt: {
                gte: startOfDay(date),
                lte: endOfDay(oneWeekLater),
            },
        };

        const [events, chores, bills, shoppingItems] = await Promise.all([
            prisma.event.findMany({
                where: {
                    householdId: user.householdId,
                    ...eventsFilter,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    date: true,
                    location: true,
                    createdBy: {
                        select: {
                            username: true,
                        },
                    },
                },
                orderBy: { date: 'asc' },
                take: 5,
            }),

            prisma.chore.findMany({
                where: {
                    householdId: user.householdId,
                    doneById: null,
                    ...choresFilter,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    dueDate: true,
                    priority: true,
                    createdBy: {
                        select: {
                            username: true,
                        },
                    },
                },
                orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
                take: 5,
            }),

            prisma.bill.findMany({
                where: {
                    householdId: user.householdId,
                    paidById: null,
                    ...billsFilter,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    amount: true,
                    dueDate: true,
                    createdBy: {
                        select: {
                            username: true,
                        },
                    },
                },
                orderBy: { dueDate: 'asc' },
                take: 5,
            }),

            prisma.shoppingItem.findMany({
                where: {
                    householdId: user.householdId,
                    boughtById: null,
                    ...shoppingFilter,
                },
                select: {
                    id: true,
                    name: true,
                    cost: true,
                    createdAt: true,
                    createdBy: {
                        select: {
                            username: true,
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
                take: 5,
            }),
        ]);

        const processedBills = bills.map((bill) => ({
            ...bill,
            amount: parseFloat(bill.amount.toString()),
        }));

        return NextResponse.json({
            events,
            chores,
            bills: processedBills,
            shoppingItems,
        });
    } catch (error) {
        console.error('Error fetching overview data:', error);
        return NextResponse.json({ error: 'Failed to fetch overview data' }, { status: 500 });
    }
}
