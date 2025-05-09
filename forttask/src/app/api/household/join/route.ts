import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to join a household' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { joinCode } = body;

        if (!joinCode || joinCode.trim().length === 0) {
            return NextResponse.json({ message: 'Join code is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { household: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.householdId) {
            return NextResponse.json(
                {
                    message:
                        'You are already a member of a household. Leave your current household before joining another.',
                },
                { status: 409 },
            );
        }

        const ownedHousehold = await prisma.household.findUnique({
            where: { ownerId: userId },
        });

        if (ownedHousehold) {
            return NextResponse.json(
                {
                    message:
                        'As a household owner, you cannot join another household. Transfer ownership or delete your household first.',
                },
                { status: 409 },
            );
        }

        const household = await prisma.household.findUnique({
            where: { joinCode: joinCode.trim() },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
                users: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        if (!household) {
            return NextResponse.json({ message: 'Invalid join code. Household not found.' }, { status: 404 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { householdId: household.id },
        });

        return NextResponse.json(
            {
                message: 'Successfully joined household',
                household: {
                    id: household.id,
                    name: household.name,
                    joinCode: household.joinCode,
                    createdAt: household.createdAt,
                    owner: household.owner,
                    users: [
                        ...household.users,
                        {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                        },
                    ],
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Error joining household:', error);
        return NextResponse.json({ message: 'Failed to join household' }, { status: 500 });
    }
}
