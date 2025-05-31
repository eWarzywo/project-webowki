import { NextResponse } from 'next/server';
import prisma from '../../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to access user info' }, { status: 401 });
        }

        if (!session.user?.householdId) {
            return NextResponse.json(
                { message: 'You must be part of a household to access user info' },
                { status: 401 },
            );
        }

        const householdId = parseInt(session.user.householdId);

        const users = await prisma.user.findMany({
            where: {
                householdId: householdId,
            },
        });

        const chores = await prisma.chore.findMany({
            where: {
                householdId: householdId,
                done: true,
            },
        });

        const usersWithChores = users.map((user) => {
            const userChores = chores.filter((chore) => chore.doneById === user.id);
            return {
                ...user,
                choresDone: userChores.length,
            };
        });

        return NextResponse.json(usersWithChores);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
