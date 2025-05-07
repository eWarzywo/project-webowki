import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';
import bcrypt from 'bcrypt';

const sanitizeName = (name: string): string => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Usuwa znaki diakrytyczne
        .replace(/[^a-z0-9]/g, '_') // Zamienia znaki specjalne na podkreślniki
        .replace(/_+/g, '_') // Zastępuje wielokrotne podkreślniki jednym
        .replace(/^_|_$/g, ''); // Usuwa podkreślniki z początku i końca
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
        };

        // Walidacja danych
        if (!body.firstName || !body.lastName || !body.email || !body.password) {
            return NextResponse.json(
                { message: 'Wymagane są wszystkie pola: imię, nazwisko, email i hasło' },
                { status: 400 },
            );
        }

        // Sanityzacja imienia i nazwiska
        const sanitizedFirstName = sanitizeName(body.firstName);
        const sanitizedLastName = sanitizeName(body.lastName);

        // Zabezpieczenie przed pustymi ciągami po sanityzacji
        if (!sanitizedFirstName || !sanitizedLastName) {
            return NextResponse.json(
                { message: 'Imię i nazwisko muszą zawierać przynajmniej jeden znak alfanumeryczny' },
                { status: 400 },
            );
        }

        // Sprawdzenie minimalnej długości imienia i nazwiska
        if (body.firstName.length < 2 || body.lastName.length < 2) {
            return NextResponse.json({ message: 'Imię i nazwisko muszą mieć co najmniej 2 znaki' }, { status: 400 });
        }

        // Sprawdzenie formatu adresu email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json({ message: 'Podaj prawidłowy adres email' }, { status: 400 });
        }

        // Sprawdzenie długości hasła
        if (body.password.length < 8) {
            return NextResponse.json({ message: 'Hasło musi mieć co najmniej 8 znaków' }, { status: 400 });
        }

        // Sprawdzenie, czy użytkownik o podanym emailu już istnieje
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: body.email }],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'Użytkownik o podanym adresie email już istnieje' },
                { status: 409 }, // Conflict status code
            );
        }

        // Hashowanie hasła
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(body.password, saltRounds);

        // Utworzenie użytkownika z unikalną nazwą użytkownika
        let username = `${body.firstName.toLowerCase()}_${body.lastName.toLowerCase()}`;
        let isUsernameUnique = false;
        let counter = 1;

        // Sprawdzanie unikalności nazwy użytkownika i dodawanie licznika, jeśli jest potrzebne
        while (!isUsernameUnique) {
            // Sprawdź, czy nazwa użytkownika już istnieje w bazie
            const existingUsername = await prisma.user.findUnique({
                where: { username },
            });

            if (!existingUsername) {
                isUsernameUnique = true;
            } else {
                // Jeśli nazwa już istnieje, dodaj licznik na końcu
                username = `${body.firstName.toLowerCase()}_${body.lastName.toLowerCase()}${counter}`;
                counter++;
            }
        }

        // Utworzenie użytkownika z unikalną nazwą
        const newUser = await prisma.user.create({
            data: {
                username: username,
                email: body.email,
                passwordHash: passwordHash,
                // Dodatkowe dane możemy przechowywać w metadanych lub dodatkowych kolumnach
            },
        });

        // Zwracamy dane użytkownika bez hasła
        const { passwordHash: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(
            {
                message: 'Konto zostało utworzone',
                user: userWithoutPassword,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        return NextResponse.json({ message: 'Wystąpił błąd podczas tworzenia konta' }, { status: 500 });
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