import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prisma';
import bcrypt from 'bcrypt';

const sanitizeName = (name: string): string => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
        };

        if (!body.firstName || !body.lastName || !body.email || !body.password) {
            return NextResponse.json(
                { message: 'Wymagane są wszystkie pola: imię, nazwisko, email i hasło' },
                { status: 400 },
            );
        }

        const sanitizedFirstName = sanitizeName(body.firstName);
        const sanitizedLastName = sanitizeName(body.lastName);

        if (!sanitizedFirstName || !sanitizedLastName) {
            return NextResponse.json(
                { message: 'Imię i nazwisko muszą zawierać przynajmniej jeden znak alfanumeryczny' },
                { status: 400 },
            );
        }

        if (body.firstName.length < 2 || body.lastName.length < 2) {
            return NextResponse.json({ message: 'Imię i nazwisko muszą mieć co najmniej 2 znaki' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json({ message: 'Podaj prawidłowy adres email' }, { status: 400 });
        }

        if (body.password.length < 8) {
            return NextResponse.json({ message: 'Hasło musi mieć co najmniej 8 znaków' }, { status: 400 });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: body.email }],
            },
        });

        if (existingUser) {
            return NextResponse.json({ message: 'Użytkownik o podanym adresie email już istnieje' }, { status: 409 });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(body.password, saltRounds);

        let username = `${body.firstName.toLowerCase()}_${body.lastName.toLowerCase()}`;
        let isUsernameUnique = false;
        let counter = 1;

        while (!isUsernameUnique) {
            const existingUsername = await prisma.user.findUnique({
                where: { username },
            });

            if (!existingUsername) {
                isUsernameUnique = true;
            } else {
                username = `${body.firstName.toLowerCase()}_${body.lastName.toLowerCase()}${counter}`;
                counter++;
            }
        }

        const newUser = await prisma.user.create({
            data: {
                username: username,
                email: body.email,
                passwordHash: passwordHash,
            },
        });

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
            await prisma.user.update({
                where: {
                    id: parseInt(userId),
                },
                data: {
                    householdId: null,
                },
            });
            
            await prisma.user.updateMany({
                where: {
                    householdId: parseInt(householdId),
                },
                data: {
                    householdId: null,
                },
            });

            await prisma.household.delete({
                where: {
                    id: parseInt(householdId),
                },
            });

            return new NextResponse(null, { status: 204 });
        }

        await prisma.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                householdId: null,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
