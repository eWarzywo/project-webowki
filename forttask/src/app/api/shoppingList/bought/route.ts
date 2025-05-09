import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';

export async function PUT(req: Request) {
    try {
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
        const itemId = parseInt(body.id);

        if (isNaN(itemId)) {
            return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
        }

        const item = await prisma.shoppingItem.findUnique({
            where: { id: itemId },
            include: { createdBy: true },
        });

        if (!item) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        if (item.householdId !== user.householdId) {
            return NextResponse.json(
                { message: 'You do not have permission to mark this item as bought' },
                { status: 403 },
            );
        }

        const updatedItem = await prisma.shoppingItem.update({
            where: { id: itemId },
            data: { boughtById: user.id, updatedAt: new Date() },
        });

        return NextResponse.json(updatedItem, { status: 200 });
    } catch (error) {
        console.error('Error marking item as bought:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
