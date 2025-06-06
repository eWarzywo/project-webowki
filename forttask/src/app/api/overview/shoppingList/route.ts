import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../../libs/prisma';
import { authOptions } from '../../../auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { household: true },
        });

        if (!user || !user.householdId) {
            return NextResponse.json({ error: 'User not in a household' }, { status: 404 });
        }

        const shoppingItems = await prisma.shoppingItem.findMany({
            where: {
                householdId: user.householdId,
                boughtById: null,
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
            orderBy: {
                createdAt: 'asc',
            },
            take: 5,
        });

        return NextResponse.json({ shoppingItems });
    } catch (error) {
        console.error('Error fetching shopping items:', error);
        return NextResponse.json({ error: 'Failed to fetch shopping items' }, { status: 500 });
    }
}
