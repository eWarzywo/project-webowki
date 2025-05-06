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
          // Szukaj użytkownika po nazwie użytkownika lub emailu
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username }
              ]
            }
          });

          // Jeśli nie znaleziono użytkownika, zwróć null
          if (!user) {
            console.log('User not found:', credentials.username);
            return null;
          }

          // Porównaj hashed password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          // Jeśli hasło jest niepoprawne, zwróć null
          if (!isPasswordValid) {
            console.log('Invalid password for:', credentials.username);
            return null;
          }

          // Przekaż dane użytkownika do sesji
          return {
            id: user.id.toString(),
            name: user.username,
            email: user.email,
            username: user.username,
            householdId: user.householdId?.toString() || null
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
      // When signing in
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.householdId = user.householdId;
      }
      
      // If this is an update session event (e.g. after joining a household)
      if (trigger === 'update' && session?.householdId) {
        token.householdId = session.householdId;
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
