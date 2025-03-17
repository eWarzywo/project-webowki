import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        return new Response(JSON.stringify(newHousehold), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const householdId = searchParams.get('householdId');

        if (!householdId) {
            return new Response(JSON.stringify({ error: 'Missing householdId parameter' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const household = await prisma.household.findUnique({
            where: {
                id: parseInt(householdId),
            },
        });

        return new Response(JSON.stringify(household), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
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

        return new Response(JSON.stringify(updatedHousehold), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
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

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
