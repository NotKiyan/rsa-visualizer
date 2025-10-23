// frontend/src/RsaProvider.jsx
import React, { useState } from 'react';
import { RsaContext } from './RsaContext';

export const RsaProvider = ({ children }) => {
    // This component now owns the 'primes' state
    const [primes, setPrimes] = useState({ p: 11, q: 13 }); // Default values

    // You could add other shared state here later if needed

    return (
        // Pass the state and the setter function down
        <RsaContext.Provider value={{ primes, setPrimes }}>
        {children}
        </RsaContext.Provider>
    );
};
