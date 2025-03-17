import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            name: string;
            amount: number;
            dueDate: string;
            description?: string;
            householdId: number;
            createdById: number;
        };

        const newBill = await prisma.bill.create({
            data: {
                name: body.name,
                amount: body.amount,
                dueDate: new Date(body.dueDate),
                description: body.description || '',
                householdId: body.householdId,
                createdById: body.createdById,
            },
        });

        return new Response(JSON.stringify(newBill), {
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

        const bills = await prisma.bill.findMany({
            where: {
                householdId: parseInt(householdId),
            },
        });

        return new Response(JSON.stringify(bills), {
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
        const billId = searchParams.get('billId');

        if (!billId) {
            return new Response(JSON.stringify({ error: 'Missing billId parameter' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await prisma.bill.delete({
            where: {
                id: parseInt(billId),
            },
        });

        return new Response(null, {
            status: 204,
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
