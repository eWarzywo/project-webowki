import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../..//auth';

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ message: 'You must be logged in to mark items as bought' }, { status: 401 });
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
            { message: 'You must be a member of a household to mark items as bought' },
            { status: 403 },
        );
    }

    const body = await req.json();
    const { paid, id } = body;

    if (typeof id !== 'number' || typeof paid !== 'boolean') {
        return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    const bill = await prisma.bill.findUnique({
        where: { id },
        include: { household: true },
    });

    if (!bill) {
        return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
    }

    if (bill.householdId !== user.householdId) {
        return NextResponse.json({ message: 'You do not have permission to mark this bill as paid' }, { status: 403 });
    }

    const updatedBill = await prisma.bill.update({
        where: { id },
        data: {
            paidById: paid ? userId : null,
            updatedAt: new Date(),
        },
    });

    return NextResponse.json({ message: 'Bill updated successfully', bill: updatedBill }, { status: 200 });
}
