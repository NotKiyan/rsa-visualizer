import React, { useState, useContext, useEffect } from 'react';
import { RsaContext } from './RsaContext';
import './Visualizations.css';
import { secp256k1 } from '@noble/curves/secp256k1.js';

const Visualizations = () => {
    const { primes } = useContext(RsaContext);
    const [activeViz, setActiveViz] = useState('rsa');

    const [rsaParams, setRsaParams] = useState({
        p: parseInt(primes.p) || 7,
                                               q: parseInt(primes.q) || 11,
                                               message: 5
    });
    const [currentStep, setCurrentStep] = useState(0);

    const [modParams, setModParams] = useState({ number: 15, modulus: 12 });
    const [modResult, setModResult] = useState(15 % 12);

    const [privateKeyKHex, setPrivateKeyKHex] = useState('3');
    const [publicKeyQPoint, setPublicKeyQPoint] = useState(null);
    const [publicKeyQDisplay, setPublicKeyQDisplay] = useState({ x: '?', y: '?'});
    const [eccError, setEccError] = useState('');


    useEffect(() => {
        setRsaParams(prevParams => ({
            ...prevParams,
            p: parseInt(primes.p) || 7,
                                    q: parseInt(primes.q) || 11
        }));
    }, [primes]);

    const calculatePublicKeyQ = () => {
        setEccError('');
        setPublicKeyQPoint(null);
        setPublicKeyQDisplay({ x: '?', y: '?' });

        try {
            if (!privateKeyKHex) {
                throw new Error('Private key k cannot be empty.');
            }
            const kString = privateKeyKHex.startsWith('0x') ? privateKeyKHex.substring(2) : privateKeyKHex;
            const k = BigInt(`0x${kString}`);

            if (k <= 0n || k >= secp256k1.ORDER) {
                throw new Error('Private key k must be a positive integer less than the curve order.');
            }

            const Q = secp256k1.Point.BASE.multiply(k);
            const qAffine = Q.toAffine();

            setPublicKeyQPoint(Q);
            setPublicKeyQDisplay({
                x: qAffine.x.toString(16),
                                 y: qAffine.y.toString(16)
            });

        } catch (error) {
            console.error("ECC Calculation Error:", error);
            const displayError = error instanceof SyntaxError || error instanceof RangeError || error instanceof TypeError
            ? 'Invalid private key format. Please use hex (e.g., A1) or decimal.'
            : error.message;
            setEccError(`Failed to calculate public key: ${displayError}`);
            setPublicKeyQPoint(null);
            setPublicKeyQDisplay({ x: 'Error', y: 'Error' });
        }
    };

    useEffect(() => {
        if (activeViz === 'ecc') {
            calculatePublicKeyQ();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [privateKeyKHex, activeViz]);


    const rsaSteps = [
        { title: "Choose Prime Numbers", description: `p = ${rsaParams.p}, q = ${rsaParams.q}` },
        { title: "Calculate n", description: `n = p × q = ${rsaParams.p} × ${rsaParams.q} = ${isNaN(rsaParams.p * rsaParams.q) ? '?' : rsaParams.p * rsaParams.q}` },
        { title: "Calculate φ(n)", description: `φ(n) = (p-1) × (q-1) = ${rsaParams.p - 1} × ${rsaParams.q - 1} = ${isNaN((rsaParams.p - 1) * (rsaParams.q - 1)) ? '?' : (rsaParams.p - 1) * (rsaParams.q - 1)}` },
        { title: "Choose e", description: "e = 65537 (standard public exponent)" },
        { title: "Calculate d", description: `d = e⁻¹ mod φ(n) = 65537⁻¹ mod ${isNaN((rsaParams.p - 1) * (rsaParams.q - 1)) ? '?' : (rsaParams.p - 1) * (rsaParams.q - 1)} (requires backend)` },
        { title: "Encryption", description: `C = M^e mod n = ${rsaParams.message}^65537 mod ${isNaN(rsaParams.p * rsaParams.q) ? '?' : rsaParams.p * rsaParams.q}` },
        { title: "Decryption", description: `M = C^d mod n = C^d mod ${isNaN(rsaParams.p * rsaParams.q) ? '?' : rsaParams.p * rsaParams.q}` }
    ];

    const handleParamChange = (param, value) => {
        const numValue = parseInt(value) || 0;
        setRsaParams(prevParams => ({
            ...prevParams,
            [param]: numValue
        }));
    };

    const handleModParamChange = (param, value) => {
        const numValue = parseInt(value) || 0;
        const newParams = {
            ...modParams,
            [param]: numValue
        };
        setModParams(newParams);

        if (newParams.modulus > 0) {
            setModResult(((newParams.number % newParams.modulus) + newParams.modulus) % newParams.modulus);
        } else {
            setModResult(NaN);
        }
    };

    const calculateHandRotation = () => {
        if (isNaN(modResult) || modParams.modulus <= 0) return 0;
        const degreesPerUnit = 360 / modParams.modulus;
        return modResult * degreesPerUnit;
    };


    const checkIsPrime = (num) => {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i = i + 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
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
                    <p>{rsaSteps[currentStep].description}</p>
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

            case 'prime':
                return (
                    <div className="viz-container">
                    <h3>Prime Number Testing</h3>
                    <div className="sieve-visualization">
                    <p>Sieve of Eratosthenes (Numbers 1-100)</p>
                    <div className="number-grid">
                    {[...Array(100)].map((_, i) => {
                        const num = i + 1;
                        const isNumPrime = checkIsPrime(num);
                        const cellClass = num === 1 ? 'composite' : (isNumPrime ? 'prime' : 'composite');
                        return (
                            <div key={i} className={`number-cell ${cellClass}`}>
                            {num}
                            </div>
                        );
                    })}
                    </div>
                    </div>
                    </div>
                );

            case 'ecc':
                const gAffine = secp256k1.Point.BASE.toAffine();
                return (
                    <div className="viz-container">
                    <h3>ECC Key Generation (secp256k1)</h3>
                    <p>Curve: secp256k1 (y² = x³ + 7)</p>
                    <p style={{fontSize: '0.8em', wordBreak: 'break-all'}}>Base Point G (hex):<br/>
                    x: {gAffine.x.toString(16)}<br/>
                    y: {gAffine.y.toString(16)}
                    </p>
                    <div className="params-input ecc-input">
                    <label>
                    Private Key (k) [hex or decimal]:
                    <input
                    type="text"
                    value={privateKeyKHex}
                    onChange={(e) => setPrivateKeyKHex(e.target.value || '1')}
                    />
                    <button onClick={calculatePublicKeyQ} style={{marginLeft: '10px'}}>Calculate Q</button>
                    </label>
                    </div>
                    {eccError && <p className="ecc-error">{eccError}</p>}
                    <div className="ecc-result">
                    <h4>Public Key Q = k × G</h4>
                    <p style={{fontSize: '0.8em', wordBreak: 'break-all'}}>Q (hex):<br/>
                    x: {publicKeyQDisplay.x}<br/>
                    y: {publicKeyQDisplay.y}
                    </p>
                    </div>
                    <div className="ecc-plot-placeholder">
                    <p>(Accurate plot for secp256k1 requires large coordinates and modular arithmetic - complex to visualize)</p>
                    <p>Showing G and Q conceptually:</p>
                    <svg width="200" height="100" viewBox="0 0 100 50">
                    <circle cx="20" cy="25" r="5" fill="lime" />
                    <text x="20" y="20" fill="lime" fontSize="8">G</text>
                    <line x1="28" y1="25" x2="68" y2="25" stroke="white" strokeWidth="1" markerEnd="url(#arrowhead)" />
                    <defs><marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="5" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5" fill="white"/></marker></defs>
                    <text x="48" y="20" fill="white" fontSize="8">k * G</text>
                    {publicKeyQDisplay.x !== '?' && publicKeyQDisplay.x !== 'Error' && (
                        <>
                        <circle cx="80" cy="25" r="5" fill="cyan" />
                        <text x="80" y="20" fill="cyan" fontSize="8">Q</text>
                        </>
                    )}
                    </svg>
                    </div>
                    <div className="ecc-explanation">
                    <p>The public key Q is obtained by adding the base point G to itself 'k' times using elliptic curve point addition rules.</p>
                    <p>It's computationally difficult to find 'k' even if you know G and Q (ECDLP).</p>
                    </div>
                    </div>
                );


                case 'modular':
                    const handRotation = calculateHandRotation();
                    const safeModulus = Math.max(1, modParams.modulus);
                    const clockNumbers = [...Array(safeModulus)].map((_, i) => i);

                    return (
                        <div className="viz-container">
                        <h3>Modular Arithmetic Visualization</h3>
                        <div className="params-input modular-input">
                        <label>
                        Number: <input type="number" value={modParams.number} onChange={(e) => handleModParamChange('number', e.target.value)} />
                        </label>
                        <label>
                        Modulus: <input type="number" value={modParams.modulus} onChange={(e) => handleModParamChange('modulus', e.target.value)} min="1" />
                        </label>
                        </div>
                        <div className="modular-clock">
                        <p>Visual representation of mod {modParams.modulus > 0 ? modParams.modulus : '(invalid)'}</p>
                        <div className="clock-circle">
                        <div className="clock-center"></div>
                        {modParams.modulus > 0 && !isNaN(modResult) && (
                            <div
                            className="clock-hand"
                            style={{
                                transform: `translateX(-50%) rotate(${handRotation}deg)`
                            }}
                            ></div>
                        )}
                        {clockNumbers.map((num) => {
                            const angle = (num * 360) / safeModulus;
                            const radius = 130;
                            const x = Math.sin((angle * Math.PI) / 180) * radius;
                            const y = -Math.cos((angle * Math.PI) / 180) * radius;
                            return (
                                <div
                                key={num}
                                className="clock-number"
                                style={{
                                    top: `calc(50% + ${y}px)`,
                                    left: `calc(50% + ${x}px)`,
                                    transform: `translate(-50%, -50%)`
                                }}
                                >
                                {num}
                                </div>
                            );
                        })}
                        </div>
                        <p className="explanation">
                        {isNaN(modResult) || modParams.modulus <= 0
                            ? "Please enter a valid positive modulus."
                            : `${modParams.number} mod ${modParams.modulus} = ${modResult}`
                        }
                        </p>
                        {!isNaN(modResult) && modParams.modulus > 0 && (
                            <p className="explanation small-explanation">
                            (The remainder when {modParams.number} is divided by {modParams.modulus})
                            </p>
                        )}
                        </div>
                        </div>
                    );

                    default:
                        return null;
        }
    };

    return (
        <div className="visualizations-page">
        <header>
        <div className="title-bar">
        <h1>CRYPTOGRAPHY VISUALIZATIONS</h1>
        <p>INTERACTIVE STEP-BY-STEP DEMONSTRATIONS</p>
        </div>
        </header>
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
        ECC
        </button>
        </div>
        {renderVisualization()}
        </div>
    );
};

export default Visualizations;
