import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            username: string;
            householdId: string | null;
        } & DefaultSession['user'];
    }

    interface User extends DefaultUser {
        username: string;
        householdId: string | null;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        householdId: string | null;
        username?: string;
    }
}
