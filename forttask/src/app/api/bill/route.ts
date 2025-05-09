import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';

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

        return NextResponse.json(newBill, { status: 201 });
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

        const bills = await prisma.bill.findMany({
            where: {
                householdId: parseInt(householdId),
            },
        });

        return NextResponse.json(bills);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const billId = searchParams.get('billId');

        if (!billId) {
            return NextResponse.json({ error: 'Missing billId parameter' }, { status: 400 });
        }

        if (isNaN(Number(billId))) {
            return NextResponse.json({ error: 'Invalid billId parameter' }, { status: 400 });
        }

        await prisma.bill.delete({
            where: {
                id: parseInt(billId),
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
