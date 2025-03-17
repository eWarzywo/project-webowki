import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import type { NextAuthOptions } from 'next-auth';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                try {
                    // Find user by username
                    const user = await prisma.user.findUnique({
                        where: { username: credentials.username },
                        include: { household: true },
                    });

                    if (!user) {
                        return null;
                    }

                    // Verify password hash
                    const passwordMatch = await compare(credentials.password, user.passwordHash);
                    if (!passwordMatch) {
                        return null;
                    }

                    // Return user data (exclude sensitive information)
                    return {
                        id: user.id.toString(),
                        name: user.username,
                        email: user.email,
                        householdId: user.householdId.toString(),
                        householdName: user.household.name,
                    };
                } catch (error) {
                    console.error('Authentication error:', error);
                    return null;
                } finally {
                    await prisma.$disconnect();
                }
            },
        }),
    ],
    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours (shorter for security)
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // Add custom user properties to JWT token
                token.id = user.id;
                token.householdId = user.householdId;
                token.householdName = user.householdName;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // Pass properties from token to session
                session.user.id = token.id;
                session.user.householdId = token.householdId;
                session.user.householdName = token.householdName;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);