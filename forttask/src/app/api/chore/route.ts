import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            name: string;
            description?: string;
            priority?: number;
            dueDate: string;
            createdAt: string;
            householdId: number;
            createdById: number;
        };

        const newChore = await prisma.chore.create({
            data: {
                name: body.name,
                description: body.description || '',
                priority: body.priority || 0,
                dueDate: new Date(body.dueDate),
                createdAt: new Date(body.createdAt),
                householdId: body.householdId,
                createdById: body.createdById,
            },
        });

        return NextResponse.json(newChore, { status: 201 });
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

        const chores = await prisma.chore.findMany({
            where: {
                householdId: parseInt(householdId),
            },
        });

        return NextResponse.json(chores);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const choreId = searchParams.get('choreId');

        if (!choreId) {
            return NextResponse.json({ error: 'Missing choreId parameter' }, { status: 400 });
        }

        await prisma.chore.delete({
            where: {
                id: parseInt(choreId),
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}