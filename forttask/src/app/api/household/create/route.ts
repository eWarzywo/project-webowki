import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';

export async function POST(req: Request) {
    try {
        // Get the authenticated user from the session
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: 'You must be logged in to create a household' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        // Parse request body
        const body = await req.json();
        const { householdName } = body;

        // Validate household householdName
        if (!householdName || householdName.trim().length < 3) {
            return NextResponse.json(
                { message: 'Household name must be at least 3 characters long' },
                { status: 400 },
            );
        }

        // Check if user already owns a household
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

        // Generate a unique join code
        // Initialize joinCode with a value when declared to satisfy TypeScript
        let joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        let isJoinCodeUnique = false;

        while (!isJoinCodeUnique) {
            // Check if code is already in use
            const existingCode = await prisma.household.findUnique({
                where: {
                    joinCode,
                },
            });

            if (!existingCode) {
                isJoinCodeUnique = true;
            } else {
                // Generate a new code only if this one is already used
                joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            }
        }

        // Create the household
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

        // Also update the user to be part of the household
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
