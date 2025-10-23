import React, { useState, useEffect, useContext } from 'react'; // <-- Import useContext
import { RsaContext } from './RsaContext'; // <-- Import the context you created
import './style.css';

// Use environment variable for the API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const App = () => {
  // --- Use Context State ---
  const { primes, setPrimes } = useContext(RsaContext); // <-- Get state from context

  // --- REMOVE local primes state ---
  // const [primes, setPrimes] = useState({ p: 11, q: 13 }); // <-- REMOVED THIS LINE

  // --- Other State Management ---
  const [keys, setKeys] = useState({});
  const [message, setMessage] = useState(88);
  const [ciphertext, setCiphertext] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const [encryptionSteps, setEncryptionSteps] = useState('Ready to Encrypt.');
  const [decryptionSteps, setDecryptionSteps] = useState('Waiting for Ciphertext.');
  const [keyGenerationSteps, setKeyGenerationSteps] = useState('');

  const isKeysGenerated = !!keys.n;
  const isEncrypted = !!ciphertext;

  // --- Function to fetch history ---
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        credentials: 'include' // <-- IMPORTANT for sessions
      });
      // Add check for response.ok before parsing JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.error) {
        setHistory(data);
      } else {
        console.error("Backend error fetching history:", data.error);
      }
    } catch (e) {
      console.error("Could not fetch history:", e);
    }
  };

  // --- useEffect to load history on mount ---
  useEffect(() => {
    fetchHistory();
  }, []); // Empty array means this runs once on load

  // --- API Handlers ---
  // These now use 'primes' and 'setPrimes' from the context

  const handleGenerateKeys = async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/generate-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(primes), // Uses context 'primes'
        credentials: 'include'
      });
      if (!response.ok) { // Check response status
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.error) { // Check for application-level error from backend
        setError(data.error);
        setKeys({});
        return;
      }

      setKeys(data);
      setKeyGenerationSteps(data.steps.join('\n'));
      setCiphertext('');
      setDecryptedMessage('');
      setEncryptionSteps('Keys successfully generated.');
      setDecryptionSteps('Ciphertext required.');

    } catch (e) {
      setError(e.message || 'Could not connect to the Node.js backend or key generation failed.');
      console.error("Generate keys error:", e);
    }
  };

  const handleEncrypt = async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
                                   credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
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
      setError(e.message || 'Encryption failed. Check message size relative to N.');
      console.error("Encrypt error:", e);
    }
  };

  const handleDecrypt = async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciphertext }),
                                   credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setDecryptedMessage(data.decryptedMessage);
      fetchHistory(); // <-- RE-FETCH HISTORY ON SUCCESS
      setDecryptionSteps(
        `${data.formula}\n` +
        `Decrypted Message M = ${data.decryptedMessage}`
      );
    } catch (e) {
      setError(e.message || 'Decryption failed.');
      console.error("Decrypt error:", e);
    }
  };

  // --- JSX ---
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
    {/* Input now reads from and writes to context 'primes' via setPrimes */}
    <input type="number" id="inputP" value={primes.p} onChange={e => setPrimes({ ...primes, p: e.target.value })} min="2" />
    </div>

    <div className="input-group">
    <label htmlFor="inputQ">Prime Q:</label>
    {/* Input now reads from and writes to context 'primes' via setPrimes */}
    <input type="number" id="inputQ" value={primes.q} onChange={e => setPrimes({ ...primes, q: e.target.value })} min="2" />
    </div>

    <button onClick={handleGenerateKeys}>GENERATE KEYS &rarr;</button>

    {keyGenerationSteps && (
      <div className="step-visualization" style={{whiteSpace: 'pre-line', marginTop: '1rem'}}>
      {keyGenerationSteps}
      </div>
    )}

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

    {/* --- History Section --- */}
    <section className="module history-module">
    <h2>PAST OPERATIONS (This Session)</h2>
    {history.length === 0 ? (
      <p className="section-instruction">No operations recorded for this session yet.</p>
    ) : (
      <div className="history-list">
      {history.map((log) => (
        <div key={log._id} className="history-item">
        <p>
        <strong>Inputs:</strong> P=<span>{log.p}</span>, Q=<span>{log.q}</span>, Message=<span>{log.message === -1 ? '(unknown)' : log.message}</span>
        </p>
        <p><strong>Ciphertext:</strong> <span>{log.ciphertext}</span></p>
        <p><strong>Decrypted:</strong> <span>{log.decryptedMessage}</span></p>
        <p className="history-timestamp"><em>{new Date(log.timestamp).toLocaleString()}</em></p>
        </div>
      ))}
      </div>
    )}
    </section>

    </div>
  );
};

export default App;
