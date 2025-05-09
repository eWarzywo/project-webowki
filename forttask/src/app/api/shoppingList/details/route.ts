import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to view item details' }, { status: 401 });
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
                { message: 'You must be a member of a household to view item details' },
                { status: 403 },
            );
        }

        const url = new URL(req.url);
        const itemId = parseInt(url.searchParams.get('id') || '');

        if (isNaN(itemId)) {
            return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
        }

        const item = await prisma.shoppingItem.findUnique({
            where: { id: itemId },
            include: { createdBy: true, boughtBy: true },
        });

        if (!item) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        if (item.householdId !== user.householdId) {
            return NextResponse.json({ message: 'You do not have permission to view this item' }, { status: 403 });
        }

        return NextResponse.json(item, { status: 200 });
    } catch (error) {
        console.error('Error fetching item details:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
