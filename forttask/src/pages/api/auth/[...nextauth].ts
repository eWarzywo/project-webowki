import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '../../../../libs/prisma';
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

            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.householdId = user.householdId?.toString() || null;
            }

            if (trigger === 'update' && session?.householdId) {
                token.householdId = session.householdId;
            }

            if (token.id && !session?.householdId) {
                try {
                    const userData = await prisma.user.findUnique({
                        where: { id: parseInt(token.id) },
                        select: { householdId: true },
                    });

                    if (userData?.householdId) {
                        if (token.householdId !== userData.householdId.toString()) {
                            token.householdId = userData.householdId.toString();
                        }
                    }
                } catch (error) {
                    console.error('Error refreshing household ID:', error);
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.householdId = token.householdId as string | null;
            }
            return session;
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

export default NextAuth(authOptions);
