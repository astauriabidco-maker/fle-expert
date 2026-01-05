import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Allows manual override or access to current brand theme
interface BrandContextType {
    primaryColor: string;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { organization } = useAuth();

    // Default brand color (e.g., standard blue)
    const defaultColor = '#2563eb'; // blue-600
    const primaryColor = organization?.primaryColor || defaultColor;

    useEffect(() => {
        // Inject CSS variable for global usage (e.g. in Tailwind utility extensions or raw CSS)
        document.documentElement.style.setProperty('--primary-color', primaryColor);

        // Example: You could also dynamically load a favicon or change document title prefix here
    }, [primaryColor]);

    return (
        <BrandContext.Provider value={{ primaryColor }}>
            {children}
        </BrandContext.Provider>
    );
};

export const useBrand = () => {
    const context = useContext(BrandContext);
    if (context === undefined) {
        throw new Error('useBrand must be used within a BrandProvider');
    }
    return context;
};
