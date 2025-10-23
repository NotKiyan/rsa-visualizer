import { useState, useContext, useEffect } from 'react'; // <-- Add useContext, useEffect
import { RsaContext } from './RsaContext'; // <-- Import context
import './Visualizations.css';

const Visualizations = () => {
    const { primes } = useContext(RsaContext); // <-- Get primes from context
    const [activeViz, setActiveViz] = useState('rsa');

    // Initialize local state using the shared context primes, with fallbacks
    const [rsaParams, setRsaParams] = useState({
        p: parseInt(primes.p) || 7, // Convert to number, provide fallback
                                               q: parseInt(primes.q) || 11, // Convert to number, provide fallback
                                               message: 5
    });
    const [currentStep, setCurrentStep] = useState(0);

    // Effect to update local rsaParams if context 'primes' change after initial load
    useEffect(() => {
        setRsaParams(prevParams => ({
            ...prevParams,
            p: parseInt(primes.p) || 7,
                                    q: parseInt(primes.q) || 11
        }));
        // Reset step if primes change? Optional.
        // setCurrentStep(0);
    }, [primes]);


    // Dynamically generate steps based on rsaParams state
    const rsaSteps = [
        { title: "Choose Prime Numbers", description: `p = ${rsaParams.p}, q = ${rsaParams.q}` },
        { title: "Calculate n", description: `n = p × q = ${rsaParams.p} × ${rsaParams.q} = ${isNaN(rsaParams.p * rsaParams.q) ? '?' : rsaParams.p * rsaParams.q}` },
        { title: "Calculate φ(n)", description: `φ(n) = (p-1) × (q-1) = ${rsaParams.p - 1} × ${rsaParams.q - 1} = ${isNaN((rsaParams.p - 1) * (rsaParams.q - 1)) ? '?' : (rsaParams.p - 1) * (rsaParams.q - 1)}` },
        { title: "Choose e", description: "e = 65537 (standard public exponent)" },
        { title: "Calculate d", description: `d = e⁻¹ mod φ(n) = 65537⁻¹ mod ${isNaN((rsaParams.p - 1) * (rsaParams.q - 1)) ? '?' : (rsaParams.p - 1) * (rsaParams.q - 1)} (requires backend)` }, // Placeholder
        { title: "Encryption", description: `C = M^e mod n = ${rsaParams.message}^65537 mod ${isNaN(rsaParams.p * rsaParams.q) ? '?' : rsaParams.p * rsaParams.q}` },
        { title: "Decryption", description: `M = C^d mod n = C^d mod ${isNaN(rsaParams.p * rsaParams.q) ? '?' : rsaParams.p * rsaParams.q}` }
    ];

    const handleParamChange = (param, value) => {
        const numValue = parseInt(value) || 0; // Ensure it's a number
        setRsaParams(prevParams => ({
            ...prevParams,
            [param]: numValue
        }));
    };

    const renderVisualization = () => {
        switch(activeViz) {
            case 'rsa':
                return (
                    <div className="viz-container">
                    <h3>RSA Algorithm Step-by-Step</h3>
                    <div className="params-input">
                    <label>
                    p: <input type="number" value={rsaParams.p} onChange={(e) => handleParamChange('p', e.target.value)} />
                    </label>
                    <label>
                    q: <input type="number" value={rsaParams.q} onChange={(e) => handleParamChange('q', e.target.value)} />
                    </label>
                    <label>
                    Message: <input type="number" value={rsaParams.message} onChange={(e) => handleParamChange('message', e.target.value)} />
                    </label>
                    </div>

                    <div className="step-display">
                    <div className="step-indicator">
                    Step {currentStep + 1} of {rsaSteps.length}
                    </div>
                    <div className="step-content">
                    <h4>{rsaSteps[currentStep].title}</h4>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{rsaSteps[currentStep].description}</p>
                    </div>
                    <div className="step-controls">
                    <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
                    ← Previous
                    </button>
                    <button onClick={() => setCurrentStep(Math.min(rsaSteps.length - 1, currentStep + 1))} disabled={currentStep === rsaSteps.length - 1}>
                    Next →
                    </button>
                    </div>

                    </div>
                    </div>
                );

            default:
                return null;
        }
    };


    return (
        <div className="visualizations-page">
        {/* ... Header ... */}
        <header>
        <div className="title-bar">
        <h1>CRYPTOGRAPHY VISUALIZATIONS</h1>
        <p>INTERACTIVE STEP-BY-STEP DEMONSTRATIONS</p>
        </div>
        </header>

        {/* ... Viz Selector ... */}
        <div className="viz-selector">
        <button className={activeViz === 'rsa' ? 'active' : ''} onClick={() => { setActiveViz('rsa'); setCurrentStep(0); }}>
        RSA Algorithm
        </button>
        <button className={activeViz === 'modular' ? 'active' : ''} onClick={() => setActiveViz('modular')}>
        Modular Arithmetic
        </button>
        <button className={activeViz === 'prime' ? 'active' : ''} onClick={() => setActiveViz('prime')}>
        Prime Testing
        </button>
        <button className={activeViz === 'ecc' ? 'active' : ''} onClick={() => setActiveViz('ecc')}>
        ECC (Coming Soon)
        </button>
        </div>

        {renderVisualization()}
        </div>
    );
};

export default Visualizations;
