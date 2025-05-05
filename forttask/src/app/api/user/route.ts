import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
        const body = await req.json() as {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
        };

        // Walidacja danych
        if (!body.firstName || !body.lastName || !body.email || !body.password) {
            return NextResponse.json(
                { message: 'Wymagane są wszystkie pola: imię, nazwisko, email i hasło' }, 
                { status: 400 }
            );
        }

        // Sprawdzenie minimalnej długości imienia i nazwiska
        if (body.firstName.length < 2 || body.lastName.length < 2) {
            return NextResponse.json(
                { message: 'Imię i nazwisko muszą mieć co najmniej 2 znaki' }, 
                { status: 400 }
            );
        }

        // Sprawdzenie formatu adresu email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { message: 'Podaj prawidłowy adres email' }, 
                { status: 400 }
            );
        }

        // Sprawdzenie długości hasła
        if (body.password.length < 8) {
            return NextResponse.json(
                { message: 'Hasło musi mieć co najmniej 8 znaków' }, 
                { status: 400 }
            );
        }

        // Sprawdzenie, czy użytkownik o podanym emailu już istnieje
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: body.email },
                    { username: body.email } // Zakładając, że używamy emaila jako nazwy użytkownika
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'Użytkownik o podanym adresie email już istnieje' }, 
                { status: 409 } // Conflict status code
            );
        }

        // Hashowanie hasła
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(body.password, saltRounds);

        // Utworzenie użytkownika
        const username = `${body.firstName.toLowerCase()}_${body.lastName.toLowerCase()}`;
        
        const newUser = await prisma.user.create({
            data: {
                username: username,
                email: body.email,
                passwordHash: passwordHash,
                // Dodatkowe dane możemy przechowywać w metadanych lub dodatkowych kolumnach
            }
        });

        // Zwracamy dane użytkownika bez hasła
        const { passwordHash: _, ...userWithoutPassword } = newUser;

        return NextResponse.json({
            message: 'Konto zostało utworzone',
            user: userWithoutPassword
        }, { status: 201 });
        
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        return NextResponse.json(
            { message: 'Wystąpił błąd podczas tworzenia konta' }, 
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
        }

        if (isNaN(Number(userId))) {
            return NextResponse.json({ error: 'Invalid userId parameter' }, { status: 400 });
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

        if (!body.id) {
            return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
        }

        if (isNaN(Number(body.id))) {
            return NextResponse.json({ error: 'Invalid userId parameter' }, { status: 400 });
        }

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

        if (isNaN(Number(userId)) || isNaN(Number(householdId))) {
            return NextResponse.json({ error: 'Invalid userId or householdId parameter' }, { status: 400 });
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

            return new NextResponse(null, { status: 204 });
        }

        await prisma.user.delete({
            where: {
                id: parseInt(userId),
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}