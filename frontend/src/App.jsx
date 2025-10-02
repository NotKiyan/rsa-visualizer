import React, { useState } from 'react';
import './style.css';

const API_BASE_URL = 'http://localhost:5000/api';
const App = () => {
  // --- State Management ---
  const [primes, setPrimes] = useState({ p: 11, q: 13 });
  const [keys, setKeys] = useState({});
  const [message, setMessage] = useState(88);
  const [ciphertext, setCiphertext] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [error, setError] = useState('');

  const [encryptionSteps, setEncryptionSteps] = useState('Ready to Encrypt.');
  const [decryptionSteps, setDecryptionSteps] = useState('Waiting for Ciphertext.');

  const isKeysGenerated = !!keys.n;
  const isEncrypted = !!ciphertext;

  // --- API Handlers ---

  const handleGenerateKeys = async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/generate-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(primes),
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setKeys({});
        return;
      }

      setKeys(data);
      setCiphertext('');
      setDecryptedMessage('');
      setEncryptionSteps('Keys successfully generated.');
      setDecryptionSteps('Ciphertext required.');

    } catch (e) {
      setError('Could not connect to the Node.js backend.');
    }
  };

  const handleEncrypt = async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setCiphertext(data.ciphertext);
      setEncryptionSteps(
        `${data.formula}\n` +
        `Ciphertext C = ${data.ciphertext}`
      );
    } catch (e) {
      setError('Encryption failed. Check message size relative to N.');
    }
  };

  const handleDecrypt = async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciphertext }),
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setDecryptedMessage(data.decryptedMessage);
      setDecryptionSteps(
        `${data.formula}\n` +
        `Decrypted Message M = ${data.decryptedMessage}`
      );
    } catch (e) {
      setError('Decryption failed.');
    }
  };

  return (
    <div className="app-container">
    <header>
    <div className="title-bar">
    <h1>RSA CRYPTOGRAPHY VISUALIZER</h1>
    <p>ASYNCHRONOUS ENCRYPTION | NUMBER THEORY IN ACTION</p>
    </div>
    </header>

    {error && <div className="error-message">ERROR: {error}</div>}

    <main>
    {/* 1. KEY GENERATION SECTION */}
    <section className="module key-generation">
    <h2>1. KEY GENERATION</h2>
    <p className="section-instruction">Choose distinct small prime numbers (p and q).</p>

    <div className="input-group">
    <label htmlFor="inputP">Prime P:</label>
    <input type="number" id="inputP" value={primes.p} onChange={e => setPrimes({ ...primes, p: e.target.value })} min="2" />
    </div>

    <div className="input-group">
    <label htmlFor="inputQ">Prime Q:</label>
    <input type="number" id="inputQ" value={primes.q} onChange={e => setPrimes({ ...primes, q: e.target.value })} min="2" />
    </div>

    <button onClick={handleGenerateKeys}>GENERATE KEYS &rarr;</button>

    <div className="output-step-container">
    <p>N (Modulus): <span>{keys.n || '?'}</span></p>
    <p>φ(n) (Totient): <span>{keys.phi || '?'}</span></p>
    <p>Public Key (e, n): (<span>{keys.e || '?'}</span>, <span>{keys.n || '?'}</span>)</p>
    <p>Private Key (d, n): (<span>{keys.d || '?'}</span>, <span>{keys.n || '?'}</span>)</p>
    </div>
    </section>

    {/* 2. ENCRYPTION SECTION */}
    <section className="module encryption">
    <h2>2. ENCRYPTION (Sender)</h2>
   <p className="section-instruction">Encrypt a message $M &lt; N$ using the Public Key.</p>

    <div className="input-group">
    <label htmlFor="inputM">Message M (Number):</label>
    <input type="number" id="inputM" value={message} onChange={e => setMessage(e.target.value)} min="0" disabled={!isKeysGenerated} />
    </div>

    <div className="formula-display">
    <p>C $\equiv$ M<sup>e</sup> mod n</p>
    </div>

    <button onClick={handleEncrypt} disabled={!isKeysGenerated}>ENCRYPT &rarr;</button>

    <div className="output-step-container">
    <p>Ciphertext C: <span>{ciphertext || '?'}</span></p>
    <div className="step-visualization" id="encryptionSteps">{encryptionSteps}</div>
    </div>
    </section>

    {/* 3. DECRYPTION SECTION */}
    <section className="module decryption">
    <h2>3. DECRYPTION (Receiver)</h2>
    <p className="section-instruction">Decrypt the ciphertext using the Private Key (d, n).</p>

    <div className="input-group">
    <label htmlFor="inputC_decrypt">Ciphertext C:</label>
    <input type="text" id="inputC_decrypt" value={ciphertext} readOnly disabled={!isEncrypted} />
    </div>

    <div className="formula-display">
    <p>M $\equiv$ C<sup>d</sup> mod n</p>
    </div>

    <button onClick={handleDecrypt} disabled={!isEncrypted}>DECRYPT &rarr;</button>

    <div className="output-step-container">
    <p>Original Message M: <span>{decryptedMessage || '?'}</span></p>
    <div className="step-visualization" id="decryptionSteps">{decryptionSteps}</div>
    </div>
    </section>
    </main>
    </div>
  );
};

export default App;
