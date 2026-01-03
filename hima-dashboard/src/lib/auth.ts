export const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('hima_token', token);
    }
};

export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('hima_token');
    }
    return null;
};

export const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('hima_token');
        localStorage.removeItem('hima_user');
    }
};

export const setUser = (user: any) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('hima_user', JSON.stringify(user));
    }
};

export const getUser = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('hima_user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    try {
        // Simple client-side check if token exists and isn't obviously expired
        // In a real app, you'd decode the JWT and check 'exp'
        return true;
    } catch (e) {
        return false;
    }
};
