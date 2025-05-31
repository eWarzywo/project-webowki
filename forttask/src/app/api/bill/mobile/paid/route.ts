import { NextResponse } from 'next/server';
import prisma from '../../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to get the bills' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { household: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (!user.householdId) {
            return NextResponse.json(
                { message: 'You must be a member of a household to get the bills' },
                { status: 403 },
            );
        }

        const householdId = user.householdId;

        const { searchParams } = new URL(req.url);
        const skip = parseInt(searchParams.get('skip') || '0');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const bills = await prisma.bill.findMany({
            where: {
                householdId,
                paidById: { not: null },
            },
            skip: skip,
            take: limit,
            orderBy: {
                dueDate: 'asc',
            },
            include: {
                createdBy: {
                    select: {
                        username: true,
                    },
                },
            },
        });

        return NextResponse.json(bills, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
