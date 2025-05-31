import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            username: string;
            householdId: string | null;
        } & DefaultSession['user'];
    }

    interface User extends Omit<DefaultUser, 'email' | 'image'> {
        id: string;
        username: string;
        householdId: string | null;
        emailVerified: Date | null;
        email: string;
        image?: string | null;
    }

    interface CredentialsConfig {
        id: string;
        name: string;
        type: 'credentials';
        credentials: Record<string, unknown>;
        authorize(credentials: Record<string, string> | undefined): Promise<User | null>;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        householdId: string | null;
        username?: string;
    }
}
