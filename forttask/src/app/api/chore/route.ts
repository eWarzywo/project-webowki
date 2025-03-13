import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json() as {
            name: string,
            description?: string,
            priority?: number,
            dueDate: string,
            createdAt: string,
            householdId: number,
            createdById: number,
        };

        const newChore = await prisma.chore.create({
            data: {
                name: body.name,
                description: body.description || "",
                priority: body.priority || 0,
                dueDate: new Date(body.dueDate),
                createdAt: new Date(body.createdAt),
                householdId: body.householdId,
                createdById: body.createdById,
            }
        });

        return new Response(JSON.stringify(newChore), {
            status: 201,
            headers: { "Content-Type" : "application/json" }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: { "Content-Type" : "application/json" },
        });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const householdId = searchParams.get('householdId');

        if (!householdId) {
            return new Response(JSON.stringify({ error: "Missing householdId parameter" }), {
                status: 400,
                headers: { "Content-Type" : "application/json" },
            });
        }

        const chores = await prisma.chore.findMany({
            where: {
                householdId: parseInt(householdId),
            },
        });

        return new Response(JSON.stringify(chores), {
            status: 200,
            headers: { "Content-Type" : "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: { "Content-Type" : "application/json" },
        });
    }
}