const express = require('express');
const cors = require('cors');
const { modInv } = require('bigint-mod-arith');
require('dotenv').config();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const port = 5000;

// --- CORS Configuration ---
app.use(cors({
    origin: ['http://localhost:5173', 'https://rsa-visualizer.onrender.com'],
    credentials: true
}));
app.use(express.json());

// --- 1. MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB...'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// --- 2. Mongoose Schema for History ---
const RsaLogSchema = new mongoose.Schema({
    sessionId: String,
    p: Number,
    q: Number,
    message: Number,
    ciphertext: String,
    decryptedMessage: String,
    timestamp: { type: Date, default: Date.now }
});
const RsaLog = mongoose.model('RsaLog', RsaLogSchema);


// --- 3. Session Middleware ---
app.use(session({
    secret: process.env.SECRET_KEY, // Make sure SECRET_KEY is in your .env
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Helper function to check if a number is prime (simplified check)
function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i = i + 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
}

// ==============================
// MODULAR EXPONENTIATION FUNCTION (ADDED!)
// ==============================
function modExp(base, exponent, modulus) {
    if (modulus === 0n) throw new Error("Modulus must be non-zero");
    if (exponent < 0n) throw new Error("Negative exponents not supported");

    base = base % modulus;
    let result = 1n;

    while (exponent > 0n) {
        if (exponent & 1n) { // Check if the last bit is 1
            result = (result * base) % modulus;
        }
        base = (base * base) % modulus;
        exponent >>= 1n; // Right shift exponent by 1 (equivalent to dividing by 2)
    }
    return result;
}


// ==============================
// 1. KEY GENERATION ENDPOINT
// ==============================
app.post('/api/generate-keys', (req, res) => {
    const { p: pStr, q: qStr } = req.body;
    const p = BigInt(pStr);
    const q = BigInt(qStr);
    if (!isPrime(Number(p)) || !isPrime(Number(q)) || p === q) {
        return res.status(400).json({ error: 'Both P and Q must be distinct, valid prime numbers.' });
    }
    try {
        const n = p * q;
        const pMinus1 = p - 1n;
        const qMinus1 = q - 1n;
        const phi = pMinus1 * qMinus1;
        // Ensure e is coprime to phi - 65537n is usually fine unless phi is a multiple of it
        const e = 65537n;
        if (phi % e === 0n) {
            throw new Error('Chosen e is not coprime to phi. Try different primes.');
        }

        const d = modInv(e, phi); // Throws error if not invertible

        // Add step-by-step explanation
        const steps = [
            `Step 1: Calculate N = p × q = ${p} × ${q} = ${n}`,
            `Step 2: Calculate φ(n) = (p-1) × (q-1) = ${pMinus1} × ${qMinus1} = ${phi}`,
         `Step 3: Choose public exponent e = ${e} (standard value, coprime to φ(n))`,
         `Step 4: Calculate private exponent d ≡ e⁻¹ (mod φ(n))`,
         `        d ≡ ${e}⁻¹ (mod ${phi}) = ${d}`
        ];


        // --- STORE KEYS ON SESSION ---
        req.session.keys = {
            n: n.toString(),
         e: e.toString(),
         d: d.toString(),
         p: p.toString(),
         q: q.toString()
        };


        res.json({
            n: n.toString(),
                 phi: phi.toString(),
                 e: e.toString(),
                 d: d.toString(),
                 steps: steps
        });
    } catch (e) {
        console.error("Key Generation Error:", e); // Log the specific error
        res.status(400).json({ error: e.message || 'Could not compute modular inverse (d). Ensure e and phi are coprime. Try different primes.' });
    }
});
// ==============================
// 2. ENCRYPTION ENDPOINT
// ==============================
app.post('/api/encrypt', (req, res) => {
    const { message: mStr } = req.body;

    if (!req.session.keys) {
        return res.status(400).json({ error: 'Keys not generated for this session. Please generate keys first.' });
    }
    const { e: eStr, n: nStr } = req.session.keys;
    const e = BigInt(eStr);
    const n = BigInt(nStr);

    const m = BigInt(mStr);
    if (m >= n) {
        return res.status(400).json({ error: `Encryption failed. Message M (${mStr}) must be less than N (${nStr}).` });
    }

    try {
        const c = modExp(m, e, n);

        // --- SAVE MESSAGE TO SESSION ---
        req.session.message = mStr;

        res.json({
            ciphertext: c.toString(),
                 formula: `C = ${mStr}^${e} mod ${n}`
        });
    } catch (error) {
        console.error("Encryption error:", error); // <-- Added logging
        res.status(500).json({ error: 'Encryption failed. An unknown error occurred.' });
    }
});

// ==============================
// 3. DECRYPTION ENDPOINT
// ==============================
app.post('/api/decrypt', async (req, res) => {
    const { ciphertext: cStr } = req.body;

    if (!req.session.keys) {
        return res.status(400).json({ error: 'Keys not generated for this session.' });
    }
    const { d: dStr, n: nStr, p, q } = req.session.keys;
    const message = req.session.message; // Get original message for logging

    if (!message) {
        console.warn("Original message not found in session during decryption log attempt.");

    }

    const d = BigInt(dStr);
    const n = BigInt(nStr);
    const c = BigInt(cStr);

    try {
        const m = modExp(c, d, n); // <-- Using the function
        const decryptedMessage = m.toString();

        // --- SAVE TO DATABASE ---
        try {
            const log = new RsaLog({
                sessionId: req.session.id,
                p: Number(p),
                                   q: Number(q),
                                   message: Number(message || -1), // Use -1 or null if original message missing
                                   ciphertext: cStr,
                                   decryptedMessage: decryptedMessage
            });
            await log.save();
        } catch (dbError) {
            console.error("Failed to save log:", dbError);
            // Don't fail the request, just log the error
        }
        // --- END SAVE TO DB ---

        res.json({
            decryptedMessage: decryptedMessage,
            formula: `M = ${cStr}^${d} mod ${n}`
        });
    } catch (error) {
        console.error("Decryption error:", error); // <-- Added logging
        res.status(500).json({ error: 'Decryption failed. An unknown error occurred.' });
    }
});

// ==============================
// 4. NEW HISTORY ENDPOINT
// ==============================
app.get('/api/history', async (req, res) => {
    if (!req.session.id) {
        return res.json([]); // No session, no history
    }
    try {
        const logs = await RsaLog.find({ sessionId: req.session.id })
        .sort({ timestamp: -1 }) // Newest first
        .limit(10); // Get last 10
        res.json(logs);
    } catch (err) {
        console.error("Error fetching history:", err); // <-- Added logging
        res.status(500).json({ error: 'Could not fetch history.' });
    }
});

// --- Server Listen ---
app.listen(port, () => {
    console.log(`RSA Backend running on http://localhost:${port}`);
});
