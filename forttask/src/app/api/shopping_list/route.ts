import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            name: string;
            description?: string;
            quantity: number;
            createdById: number;
            householdId: number;
        };

        const newEvent = await prisma.shoppingItem.create({
            data: {
                name: body.name,
                description: body.description || '',
                quantity: body.quantity,
                createdById: body.createdById,
                householdId: body.householdId,
            },
        });

        return new Response(JSON.stringify(newEvent), {
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

        const items = await prisma.shoppingItem.findMany({
            where: {
                householdId: parseInt(householdId),
            },
        });

        return new Response(JSON.stringify(items), {
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
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await prisma.shoppingItem.delete({
            where: {
                id: parseInt(id),
            },
        });

        return new Response(null, {
            status: 204,
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
