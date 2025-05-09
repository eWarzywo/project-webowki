import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to create a household' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { householdName } = body;

        if (!householdName || householdName.trim().length < 3) {
            return NextResponse.json({ message: 'Household name must be at least 3 characters long' }, { status: 400 });
        }

        const existingOwnership = await prisma.household.findUnique({
            where: {
                ownerId: userId,
            },
        });

        if (existingOwnership) {
            return NextResponse.json(
                { message: 'You already own a household. You can only own one household at a time.' },
                { status: 409 },
            );
        }

        let joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        let isJoinCodeUnique = false;

        while (!isJoinCodeUnique) {
            const existingCode = await prisma.household.findUnique({
                where: {
                    joinCode,
                },
            });

            if (!existingCode) {
                isJoinCodeUnique = true;
            } else {
                joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            }
        }

        const household = await prisma.household.create({
            data: {
                name: householdName.trim(),
                joinCode,
                ownerId: userId,
                users: {
                    connect: {
                        id: userId,
                    },
                },
            },
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

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                householdId: household.id,
            },
        });

        return NextResponse.json(
            {
                message: 'Household created successfully',
                household: {
                    id: household.id,
                    name: household.name,
                    joinCode: household.joinCode,
                    createdAt: household.createdAt,
                    owner: household.owner,
                    users: household.users,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Error creating household:', error);
        return NextResponse.json({ message: 'Failed to create household' }, { status: 500 });
    }
}
