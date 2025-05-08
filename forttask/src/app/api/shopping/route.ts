import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            name: string;
            description?: string;
            quantity: number;
            createdById: number;
            householdId: number;
        };

        const newItem = await prisma.shoppingItem.create({
            data: {
                name: body.name,
                description: body.description || '',
                quantity: body.quantity,
                createdById: body.createdById,
                householdId: body.householdId,
            },
        });

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const householdId = searchParams.get('householdId');

        if (!householdId) {
            return NextResponse.json({ error: 'Missing householdId parameter' }, { status: 400 });
        }

        if (isNaN(Number(householdId))) {
            return NextResponse.json({ error: 'Invalid householdId parameter' }, { status: 400 });
        }

        const items = await prisma.shoppingItem.findMany({
            where: {
                householdId: parseInt(householdId),
            },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }

        if (isNaN(Number(id))) {
            return NextResponse.json({ error: 'Invalid id parameter' }, { status: 400 });
        }

        await prisma.shoppingItem.delete({
            where: {
                id: parseInt(id),
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
