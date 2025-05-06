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
            console.log('JWT Callback - Input token:', JSON.stringify(token));
            console.log('JWT Callback - Trigger:', trigger);

            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.householdId = user.householdId;
                console.log('JWT Callback - User sign-in, householdId:', user.householdId);
            }

            if (trigger === 'update' && session?.householdId) {
                token.householdId = session.householdId;
                console.log('JWT Callback - Session update with new householdId:', session.householdId);
            }

            if (token.id && !session?.householdId) {
                try {
                    // Fetch the latest user data to get current householdId
                    const userData = await prisma.user.findUnique({
                        where: { id: parseInt(token.id) },
                        select: { householdId: true },
                    });

                    if (userData?.householdId) {
                        // Only update if different from current token value
                        if (token.householdId !== userData.householdId.toString()) {
                            console.log(`JWT Callback - Refreshing householdId from DB. 
                Token had: ${token.householdId}, 
                DB has: ${userData.householdId}`);
                            token.householdId = userData.householdId.toString();
                        }
                    }
                } catch (error) {
                    console.error('Error refreshing household ID:', error);
                }
            }

            console.log('JWT Callback - Final token:', JSON.stringify(token));
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.householdId = token.householdId as string | null;
                console.log('Session Callback - Setting householdId:', token.householdId);
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
