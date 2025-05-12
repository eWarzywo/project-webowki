import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../..//auth';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const billDetails = await prisma.bill.findUnique({
            where: {
                id: parseInt(id),
            },
            select: {
                id: true,
                name: true,
                description: true,
                amount: true,
                cycle: true,
                dueDate: true,
                createdAt: true,
                updatedAt: true,
                createdBy: {
                    select: { username: true },
                },
                paidBy: {
                    select: { username: true },
                },
                household: {
                    select: { name: true },
                },
            },
        });

        if (!billDetails) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        return NextResponse.json(billDetails, { status: 200 });
    } catch (error) {
        console.error('Error fetching bill details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
