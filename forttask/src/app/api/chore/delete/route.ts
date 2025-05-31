import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to delete chores' }, { status: 401 });
        }

        if (!session.user?.householdId) {
            return NextResponse.json({ message: 'You must be part of a household to delete chores' }, { status: 401 });
        }

        const body = await req.json();
        const { choreId } = body;

        if (!choreId) {
            return NextResponse.json({ message: 'Chore ID is required' }, { status: 400 });
        }

        const chore = await prisma.chore.delete({
            where: {
                id: choreId,
            },
        });

        if (!chore) {
            return NextResponse.json({ message: 'Chore not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Chore deleted successfully', chore });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
