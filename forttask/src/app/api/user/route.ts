import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json() as {
            username: string,
            email: string,
            passwordHash: string,
            householdId: number,
        };

        const newUser = await prisma.user.create({
            data: {
                username: body.username,
                email: body.email,
                passwordHash: body.passwordHash,
                householdId: body.householdId,
            }
        });

        return new Response(JSON.stringify(newUser), {
            status: 201,
            headers: {"Content-Type": "application/json"},
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: {"Content-Type": "application/json"},
        });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing userId parameter" }), {
                status: 400,
                headers: {"Content-Type": "application/json"},
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(userId),
            },
        });

        return new Response(JSON.stringify(user), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: {"Content-Type": "application/json"},
        });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json() as {
            id: number,
            username?: string,
            email?: string,
            passwordHash?: string,
        };

        const updatedUser = await prisma.user.update({
            where: {
                id: body.id,
            },
            data: {
                username: body.username,
                email: body.email,
                passwordHash: body.passwordHash,
            }
        });

        return new Response(JSON.stringify(updatedUser), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: {"Content-Type": "application/json"},
        });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const householdId = searchParams.get('householdId');

        if (!userId || !householdId) {
            return new Response(JSON.stringify({ error: "Missing userId or householdId parameter" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
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
            return new Response(JSON.stringify({ error: "Household not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
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

            return new Response(JSON.stringify({ message: "Household and users deleted successfully" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        await prisma.user.delete({
            where: {
                id: parseInt(userId),
            },
        });

        return new Response(JSON.stringify({ message: "User deleted successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
}
