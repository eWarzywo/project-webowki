import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // Add extra logging
                console.log('Auth attempt with:', credentials?.username);

                if (!credentials?.username || !credentials?.password) {
                    console.log('Missing credentials');
                    return null;
                }

                // Simple hardcoded user for testing
                if (credentials.username === 'admin' && credentials.password === 'password') {
                    console.log('Login successful for:', credentials.username);
                    return {
                        id: '1',
                        name: 'John Doe',
                        email: 'john@example.com',
                        username: 'admin',
                    };
                }

                console.log('Invalid credentials for:', credentials.username);
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
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
