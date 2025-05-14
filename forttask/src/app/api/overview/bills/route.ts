import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../../libs/prisma';
import { startOfDay, endOfDay } from 'date-fns';
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

        let dateFilter = {};
        if (dateParam) {
            const date = new Date(dateParam);
            dateFilter = {
                dueDate: {
                    gte: startOfDay(date),
                    lte: endOfDay(date),
                }
            };
        }

        const bills = await prisma.bill.findMany({
            where: {
                householdId: user.householdId,
                paidById: null,
                ...dateFilter
            },
            select: {
                id: true,
                name: true,
                description: true,
                amount: true,
                dueDate: true,
                createdBy: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: {
                dueDate: 'asc'
            },
            take: 3
        });

        return NextResponse.json({ 
            bills: bills.map(bill => ({
                ...bill,
                amount: parseFloat(bill.amount.toString())
            })) 
        });
    } catch (error) {
        console.error('Error fetching bills:', error);
        return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
    }
}