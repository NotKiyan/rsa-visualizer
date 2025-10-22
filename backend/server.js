const express = require('express');
const cors = require('cors');
const { modInv } = require('bigint-mod-arith');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// let CURRENT_KEYS = {};

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
// 1. KEY GENERATION ENDPOINT (REFRESHED)
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
        const e = 65537n;
        const d = modInv(e, phi);

        // Add step-by-step explanation
        const steps = [
            `Step 1: Calculate N = p × q = ${p} × ${q} = ${n}`,
            `Step 2: Calculate φ(n) = (p-1) × (q-1) = ${pMinus1} × ${qMinus1} = ${phi}`,
         `Step 3: Choose public exponent e = ${e} (standard value)`,
         `Step 4: Calculate private exponent d ≡ e⁻¹ (mod φ(n))`,
         `        d ≡ ${e}⁻¹ (mod ${phi}) = ${d}`
        ];

        CURRENT_KEYS = { n, e, d };
        res.json({
            n: n.toString(),
                 phi: phi.toString(),
                 e: e.toString(),
                 d: d.toString(),
                 steps: steps  // Add this
        });
    } catch (e) {
        res.status(400).json({ error: 'Could not compute modular inverse (d). Try different primes.' });
    }
});
// ==============================
// 2. ENCRYPTION ENDPOINT (MISSING ENDPOINT ADDED)
// ==============================
app.post('/api/encrypt', (req, res) => {
    const { message: mStr } = req.body;
    const { e, n } = CURRENT_KEYS;

    if (!e || !n) {
        return res.status(400).json({ error: 'Keys not generated. Generate keys first.' });
    }

    const m = BigInt(mStr);

    // CRUCIAL CHECK: Message M must be less than Modulus N
    if (m >= n) {
        return res.status(400).json({ error: 'Encryption failed. Check message size relative to N.' });
    }

    try {
        // C = M^e mod n
        const c = modExp(m, e, n);

        res.json({
            ciphertext: c.toString(),
            formula: `C = ${mStr}^${e} mod ${n}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Encryption failed. An unknown error occurred.' });
    }
});

// ==============================
// 3. DECRYPTION ENDPOINT (MISSING ENDPOINT ADDED)
// ==============================
app.post('/api/decrypt', (req, res) => {
    const { ciphertext: cStr } = req.body;
    const { d, n } = CURRENT_KEYS;

    if (!d || !n) {
        return res.status(400).json({ error: 'Keys not generated. Generate keys first.' });
    }

    const c = BigInt(cStr);

    try {
        // M = C^d mod n
        const m = modExp(c, d, n);

        res.json({
            decryptedMessage: m.toString(),
            formula: `M = ${cStr}^${d} mod ${n}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Decryption failed. An unknown error occurred.' });
    }
});



function modExp(base, exponent, modulus) {
    if (modulus === 0n) throw new Error("Modulus must be non-zero");
    if (exponent < 0n) throw new Error("Negative exponents not supported");

    base = base % modulus;
    let result = 1n;

    while (exponent > 0n) {
        if (exponent & 1n) {
            result = (result * base) % modulus;
        }
        base = (base * base) % modulus;
        exponent >>= 1n;
    }
    return result;
}

app.listen(port, () => {
    console.log(`RSA Backend running on http://localhost:${port}`);
});
