import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to view the shopping list' }, { status: 401 });
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
                { message: 'You must be a member of a household to view the shopping list' },
                { status: 403 },
            );
        }

        const { searchParams } = new URL(req.url);
        const skip = parseInt(searchParams.get('skip') || '0');
        const limit = parseInt(searchParams.get('limit') || '0');

        if (isNaN(skip) || skip < 0) {
            return NextResponse.json({ message: 'Invalid skip parameter' }, { status: 400 });
        }

        if (isNaN(limit) || limit <= 0) {
            return NextResponse.json({ message: 'Invalid limit parameter' }, { status: 400 });
        }

        const shoppingItems = await prisma.shoppingItem.findMany({
            where: { householdId: user.householdId },
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: limit,
            include: { createdBy: true },
        });

        return NextResponse.json(shoppingItems, { status: 200 });
    } catch (error) {
        console.error('Error fetching shopping list:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to join a household' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { name, cost } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ message: 'Name is required' }, { status: 400 });
        }

        if (isNaN(cost) || cost <= 0) {
            return NextResponse.json({ message: 'Cost must be a positive number' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { household: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (!user.householdId) {
            return NextResponse.json({ message: 'You must be a member of a household to add items' }, { status: 403 });
        }

        const shoppingItem = await prisma.shoppingItem.create({
            data: {
                name: name.trim(),
                cost: parseFloat(cost.toString()),
                createdById: userId,
                householdId: user.householdId,
            },
        });

        return NextResponse.json(shoppingItem, { status: 201 });
    } catch (error) {
        console.error('Error creating shopping item:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to delete an item' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(req.url);
        const itemId = parseInt(searchParams.get('id') || '');

        if (isNaN(itemId)) {
            return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
        }

        const item = await prisma.shoppingItem.findUnique({
            where: { id: itemId },
        });

        if (!item) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        if (item.createdById !== userId) {
            return NextResponse.json({ message: 'You are not authorized to delete this item' }, { status: 403 });
        }

        await prisma.shoppingItem.delete({
            where: { id: itemId },
        });

        return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting shopping item:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
