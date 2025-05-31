import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to view shopping list count' }, { status: 401 });
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
                { message: 'You must be a member of a household to view shopping list count' },
                { status: 403 },
            );
        }

        const count = await prisma.shoppingItem.count({
            where: { householdId: user.householdId },
        });
        return NextResponse.json({ count }, { status: 200 });
    } catch (error) {
        console.error('Error fetching shopping list count:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
