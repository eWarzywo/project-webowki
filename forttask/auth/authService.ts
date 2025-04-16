export async function authenticateUser(username: string, password: string) {
    // Replace this with your actual authentication logic (e.g., database query)
    if (username === 'admin' && password === 'password') {
        return { id: 1, name: 'John Doe', email: 'john@example.com' };
    }
    return null;
}