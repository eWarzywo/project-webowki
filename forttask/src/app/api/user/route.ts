import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            username: string;
            email: string;
            passwordHash: string;
            householdId: number;
        };

        const newUser = await prisma.user.create({
            data: {
                username: body.username,
                email: body.email,
                passwordHash: body.passwordHash,
                householdId: body.householdId,
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(userId),
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = (await req.json()) as {
            id: number;
            username?: string;
            email?: string;
            passwordHash?: string;
        };

        const updatedUser = await prisma.user.update({
            where: {
                id: body.id,
            },
            data: {
                username: body.username,
                email: body.email,
                passwordHash: body.passwordHash,
            },
        });

        return NextResponse.json(updatedUser);
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

        const household = await prisma.household.findUnique({
            where: {
                id: parseInt(householdId),
            },
            include: {
                owner: true,
                users: true,
            },
        });

        if (!household) {
            return NextResponse.json({ error: 'Household not found' }, { status: 404 });
        }

        if (household.ownerId === parseInt(userId)) {
            await prisma.user.deleteMany({
                where: {
                    householdId: parseInt(householdId),
                    id: { not: parseInt(userId) },
                },
            });

            await prisma.household.delete({
                where: {
                    id: parseInt(householdId),
                },
            });

            return NextResponse.json({ message: 'Household and users deleted successfully' });
        }

        await prisma.user.delete({
            where: {
                id: parseInt(userId),
            },
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}