import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            name: string;
            joinCode: string;
            ownerId: number;
        };

        const newHousehold = await prisma.household.create({
            data: {
                name: body.name,
                joinCode: body.joinCode,
                ownerId: body.ownerId,
            },
        });

        return NextResponse.json(newHousehold, { status: 201 });
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

        const household = await prisma.household.findUnique({
            where: {
                id: parseInt(householdId),
            },
        });

        return NextResponse.json(household);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = (await req.json()) as {
            id: number;
            name: string;
            joinCode: string;
        };

        const updatedHousehold = await prisma.household.update({
            where: {
                id: body.id,
            },
            data: {
                name: body.name,
                joinCode: body.joinCode,
            },
        });

        return NextResponse.json(updatedHousehold);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = (await req.json()) as {
            id: number;
        };

        await prisma.user.deleteMany({
            where: {
                householdId: body.id,
            },
        });

        await prisma.household.delete({
            where: {
                id: body.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}