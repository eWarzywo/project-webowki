import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json() as {
            name: string,
            amount: number,
            date: string,
            description?: string,
            householdId: number,
            createdById: number,
        }

        const newBill = await prisma.bill.create({
            data: {
                name: body.name,
                amount: body.amount,
                date: new Date(body.date),
                description: body.description || "",
                householdId: body.householdId,
                createdById: body.createdById,
            }
        });

        return new Response(JSON.stringify(newBill), {
            status: 201,
            headers: { "Content-Type" : "application/json" }
        })
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: { "Content-Type" : "application/json" },
        })
    }
}