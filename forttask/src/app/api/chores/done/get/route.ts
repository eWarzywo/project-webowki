import { NextResponse } from 'next/server';
import prisma from '../../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to view chores' }, { status: 401 });
        }

        if (!session.user?.householdId) {
            return NextResponse.json({ message: 'You must be a part of a household to view chores' }, { status: 401 });
        }

        const householdId = parseInt(session.user.householdId);

        const url = new URL(req.url);
        const searchParams = url.searchParams;

        const limitParam = searchParams.get('limit');
        const skipParam = searchParams.get('skip');

        const limit = limitParam ? parseInt(limitParam, 10) : undefined;
        const skip = skipParam ? parseInt(skipParam, 10) : undefined;

        const whereClause = {
            householdId: householdId,
            done: true,
        };

        const count = await prisma.chore.count({
            where: whereClause,
        });

        const chores = await prisma.chore.findMany({
            where: whereClause,
            include: {
                createdBy: true,
                doneBy: true,
            },
            ...(skip !== undefined && { skip }),
            ...(limit !== undefined && { take: limit }),
            orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
        });

        return NextResponse.json({
            chores,
            count,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
