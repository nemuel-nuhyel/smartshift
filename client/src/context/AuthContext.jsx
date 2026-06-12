import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, api, clearAuthToken, setAuthToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        api('/user')
            .then((currentUser) => {
                if (active) {
                    setUser(currentUser);
                }
            })
            .catch((error) => {
                if (!active) {
                    return;
                }

                if (error instanceof ApiError && error.status === 401) {
                    setUser(null);
                    return;
                }

                console.error(error);
                setUser(null);
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const syncAuthState = (payload) => {
        setAuthToken(payload.token);
        setUser(payload.user);
        queryClient.clear();
    };

    const login = async (values) => {
        const payload = await api('/login', {
            method: 'POST',
            body: values,
        });

        syncAuthState(payload);
        return payload.user;
    };

    const register = async (values) => {
        const payload = await api('/register', {
            method: 'POST',
            body: values,
        });

        syncAuthState(payload);
        return payload.user;
    };

    const logout = async () => {
        try {
            await api('/logout', { method: 'POST' });
        } finally {
            clearAuthToken();
            setUser(null);
            queryClient.clear();
        }
    };

    const value = useMemo(() => ({
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
    }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider.');
    }

    return context;
}
