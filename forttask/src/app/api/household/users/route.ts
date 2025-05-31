import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

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

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: {
                householdId: parseInt(householdId),
            },
            select: {
                id: true,
                username: true,
                email: true,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const householdId = searchParams.get('householdId');

        if (!userId || !householdId) {
            return NextResponse.json({ error: 'Missing userId or householdId parameter' }, { status: 400 });
        }

        if (isNaN(Number(userId)) || isNaN(Number(householdId))) {
            return NextResponse.json({ error: 'Invalid userId or householdId parameter' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.id !== userId && String(session.user.householdId) !== householdId) {
            return NextResponse.json({ error: 'Unauthorized to remove this user' }, { status: 403 });
        }

        const household = await prisma.household.findUnique({
            where: {
                id: parseInt(householdId),
            },
        });

        if (!household) {
            return NextResponse.json({ error: 'Household not found' }, { status: 404 });
        }

        if (household.ownerId === parseInt(userId)) {
            return NextResponse.json(
                {
                    error: 'Household owner cannot leave the household. You must delete the household or transfer ownership first.',
                },
                { status: 400 },
            );
        }

        await prisma.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                householdId: null,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
