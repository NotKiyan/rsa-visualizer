import { useState } from 'react';
import './Visualizations.css';

const Visualizations = () => {
    const [activeViz, setActiveViz] = useState('rsa');
    const [rsaParams, setRsaParams] = useState({ p: 7, q: 11, message: 5 });
    const [currentStep, setCurrentStep] = useState(0);

    // RSA Visualization Steps
    const rsaSteps = [
        { title: "Choose Prime Numbers", description: `p = ${rsaParams.p}, q = ${rsaParams.q}` },
        { title: "Calculate n", description: `n = p × q = ${rsaParams.p} × ${rsaParams.q} = ${rsaParams.p * rsaParams.q}` },
        { title: "Calculate φ(n)", description: `φ(n) = (p-1) × (q-1) = ${rsaParams.p - 1} × ${rsaParams.q - 1} = ${(rsaParams.p - 1) * (rsaParams.q - 1)}` },
        { title: "Choose e", description: "e = 65537 (standard public exponent)" },
        { title: "Calculate d", description: "d = e⁻¹ mod φ(n) (using Extended Euclidean Algorithm)" },
        { title: "Encryption", description: `C = M^e mod n = ${rsaParams.message}^e mod n` },
        { title: "Decryption", description: "M = C^d mod n" }
    ];

    const renderVisualization = () => {
        switch(activeViz) {
            case 'rsa':
                return (
                    <div className="viz-container">
                    <h3>RSA Algorithm Step-by-Step</h3>
                    <div className="params-input">
                    <label>
                    p: <input type="number" value={rsaParams.p} onChange={(e) => setRsaParams({...rsaParams, p: parseInt(e.target.value)})} />
                    </label>
                    <label>
                    q: <input type="number" value={rsaParams.q} onChange={(e) => setRsaParams({...rsaParams, q: parseInt(e.target.value)})} />
                    </label>
                    <label>
                    Message: <input type="number" value={rsaParams.message} onChange={(e) => setRsaParams({...rsaParams, message: parseInt(e.target.value)})} />
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

            case 'modular':
                return (
                    <div className="viz-container">
                    <h3>Modular Arithmetic Visualization</h3>
                    <div className="modular-clock">
                    <p>Visual representation of mod 12 (clock)</p>
                    <div className="clock-circle">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="clock-number" style={{
                            transform: `rotate(${i * 30}deg) translate(100px) rotate(-${i * 30}deg)`
                        }}>
                        {i}
                        </div>
                    ))}
                    </div>
                    <p className="explanation">13 mod 12 = 1 (goes around once)</p>
                    </div>
                    </div>
                );

            case 'prime':
                return (
                    <div className="viz-container">
                    <h3>Prime Number Testing</h3>
                    <div className="sieve-visualization">
                    <p>Sieve of Eratosthenes</p>
                    <div className="number-grid">
                    {[...Array(100)].map((_, i) => {
                        const num = i + 1;
                        const isPrime = num > 1 && ![...Array(Math.floor(Math.sqrt(num)))].some((_, j) => j > 1 && num % (j + 1) === 0);
                        return (
                            <div key={i} className={`number-cell ${isPrime ? 'prime' : 'composite'}`}>
                            {num}
                            </div>
                        );
                    })}
                    </div>
                    </div>
                    </div>
                );

            case 'ecc':
                return (
                    <div className="viz-container">
                    <h3>Elliptic Curve Cryptography</h3>
                    <p>Coming Soon: Interactive ECC visualization</p>
                    <div className="ecc-placeholder">
                    <p>Will show:</p>
                    <ul>
                    <li>Point addition on curves</li>
                    <li>Scalar multiplication</li>
                    <li>Key generation process</li>
                    </ul>
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
        ECC (Coming Soon)
        </button>
        </div>

        {renderVisualization()}
        </div>
    );
};

export default Visualizations;
