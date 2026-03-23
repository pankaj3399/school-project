/**
 * Shared authentication utility to retrieve the current auth token
 * from user context or localStorage.
 * 
 * @param user Optional user object which may contain a token
 * @returns string | null The authentication token
 */
export function getAuthToken(user?: { token?: string } | null): string | null {
    if (user && user.token) {
        return user.token;
    }
    return localStorage.getItem('token');
}
