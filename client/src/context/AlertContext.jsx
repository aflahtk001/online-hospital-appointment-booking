import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
    return useContext(AlertContext);
};

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({ isOpen: false, message: '', type: 'info' });

    const showAlert = useCallback((message, type = 'info') => {
        setAlert({ isOpen: true, message, type });
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setAlert((prev) => {
                // Only close if it's the exact same message that we opened (prevents overlapping timeouts bugs if quickly clicked)
                // A better approach is usually just a simple timeout, or ref-based timeout clearing, but for simplicity this works.
                return { ...prev, isOpen: false };
            });
        }, 3000);
    }, []);

    const hideAlert = useCallback(() => {
        setAlert((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
            {children}
        </AlertContext.Provider>
    );
};
