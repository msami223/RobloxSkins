'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        try {
            // Updated to match the backend route we just protected
            // Assuming base URL helper or proxy setup, otherwise full URL
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004'}/oauth/current-user`); // Adjust route as per backend
            if (response.ok) {
                const data = await response.json();
                setUser(data.data); // data.data because ApiResponse wrapper has { data: ... }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    const login = (userData) => {
      setUser(userData);
    };

    const logout = async () => {
        try {
             await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004'}/oauth/logout`, { method: 'POST' });
             setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
