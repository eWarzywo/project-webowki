import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json() as {
            name: string,
            description?: string,
            date: string,
            attendees: number[],
            householdId: number,
            createdById: number,
        }

        const newEvent = await prisma.event.create({
            data: {
                name: body.name,
                description: body.description || "",
                date: new Date(body.date),
                householdId: body.householdId,
                createdById: body.createdById,
                attendees: {
                    create: body.attendees.map(userId => ({
                        user: { connect: { id: userId }}
                    }))
                }
            },
            include: { attendees:{ include: { user:true } } }
        });

        return new Response(JSON.stringify(newEvent), {
            status: 201,
            headers: {"Content-Type": "application/json"},
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: {"Content-Type": "application/json"},
        })
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

        const events = await prisma.event.findMany({
            where: {
                attendees: {
                    some: { userId: parseInt(userId) }
                },
            },
            include: { attendees:{ include: { user:true } } }
        });

        return new Response(JSON.stringify(events), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: {"Content-Type": "application/json"},
        })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return new Response(JSON.stringify({ error: "Missing eventId parameter" }), {
                status: 400,
                headers: {"Content-Type": "application/json"},
            });
        }

        await prisma.event.delete({
            where: { id: parseInt(eventId) }
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: {"Content-Type": "application/json"},
        })
    }
}