import 'next-auth';

declare module 'next-auth' {
    interface User {
        householdId: string;
        householdName: string;
    }

    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            householdId: string;
            householdName: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        householdId: string;
        householdName: string;
    }
}
