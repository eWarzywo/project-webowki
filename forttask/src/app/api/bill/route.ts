import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to create a bill' }, { status: 401 });
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
                { message: 'You must be a member of a household to create a bill' },
                { status: 403 },
            );
        }

        const householdId = user.householdId;

        const body = (await req.json()) as {
            name: string;
            amount: number;
            cycle: number;
            dueDate: string;
            description?: string;
        };

        const newBill = await prisma.bill.create({
            data: {
                name: body.name,
                amount: body.amount,
                cycle: body.cycle,
                dueDate: new Date(body.dueDate),
                description: body.description || '',
                householdId: householdId,
                createdById: userId,
            },
        });

        return NextResponse.json(newBill, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

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
        const limit = parseInt(searchParams.get('limit') || '0');

        const bills = await prisma.bill.findMany({
            where: {
                householdId,
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
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to delete a bill' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(req.url);
        const billId = parseInt(searchParams.get('id') || '');

        if (isNaN(billId)) {
            return NextResponse.json({ message: 'Invalid bill ID' }, { status: 400 });
        }

        const bill = await prisma.bill.findUnique({
            where: { id: billId },
        });

        if (!bill) {
            return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { household: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (!user.householdId || bill.householdId !== user.householdId) {
            return NextResponse.json({ message: 'You are not authorized to delete this bill' }, { status: 403 });
        }

        await prisma.bill.delete({
            where: { id: billId },
        });

        return NextResponse.json({ message: 'Bill deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting bill:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
