import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '../../libs/prisma';
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username/Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    console.log('Missing credentials');
                    return null;
                }

                try {
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [{ username: credentials.username }, { email: credentials.username }],
                        },
                    });

                    if (!user) {
                        console.log('User not found:', credentials.username);
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

                    if (!isPasswordValid) {
                        console.log('Invalid password for:', credentials.username);
                        return null;
                    }

                    return {
                        id: user.id.toString(),
                        name: user.username,
                        email: user.email,
                        username: user.username,
                        householdId: user.householdId?.toString() || null,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            const minimalToken = {
                id: token.id,
                householdId: token.householdId,
                username: token.username,
            };

            if (user) {
                minimalToken.id = user.id;
                minimalToken.householdId = user.householdId?.toString() || null;
                minimalToken.username = user.username;
            }

            if (trigger === 'update' && session?.householdId) {
                minimalToken.householdId = session.householdId;
            }

            if (minimalToken.id && !session?.householdId && minimalToken.householdId === null) {
                try {
                    const userData = await prisma.user.findUnique({
                        where: { id: parseInt(minimalToken.id) },
                        select: { householdId: true },
                    });

                    if (userData?.householdId) {
                        minimalToken.householdId = userData.householdId.toString();
                    }
                } catch (error) {
                    console.error('Error refreshing household ID:', error);
                }
            }

            if (authOptions.debug) {
                console.log('JWT callback:', minimalToken);
            }
            return minimalToken;
        },

        async session({ session, token }) {
            const minimalSession = {
                user: {
                    id: token.id as string,
                    username: '',
                    householdId: token.householdId as string | null,
                },
                expires: session.expires,
            };

            if (!token.username) {
                try {
                    const user = await prisma.user.findUnique({
                        where: { id: parseInt(token.id as string) },
                        select: { username: true },
                    });
                    minimalSession.user.username = user?.username || '';
                } catch (error) {
                    console.error('Error fetching username:', error);
                }
            } else {
                minimalSession.user.username = token.username as string;
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('Session callback:', minimalSession);
            }
            return minimalSession;
        },
    },
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/login',
    },
};
