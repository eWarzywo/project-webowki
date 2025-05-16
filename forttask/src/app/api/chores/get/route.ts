import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({message: 'You must be logged in to view chores'}, {status: 401});
        }

        if (!session.user?.householdId) {
            return NextResponse.json({message: 'You must be a part of a household to view chores'}, {status: 401});
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
        };

        const count = await prisma.chore.count({
            where: whereClause,
        });

        const choresQuery = await prisma.chore.findMany({
            where: whereClause,
            include: {
                createdBy: true,
                doneBy: true,
            },
            ...(skip !== undefined && { skip }),
            ...(limit !== undefined && { take: limit }),
        });

        const chores = choresQuery.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            } else {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
        });

        return NextResponse.json({ chores, count });
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: 'Invalid request'}, {status: 400});
    }
}