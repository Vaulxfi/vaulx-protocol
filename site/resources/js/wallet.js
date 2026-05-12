// GFWallet — Phantom/Backpack connect + balances + tx signing helpers

const DEVNET_URL = (window.GF_CONFIG && window.GF_CONFIG.rpcUrl) || 'https://api.devnet.solana.com';
const USDC_MINT = (window.GF_CONFIG && window.GF_CONFIG.usdcMint) || '3eXFpUHRtg7UdJviTtz9LP87LfGk2aYsPDfkjDFai672';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const MEMO_PROGRAM = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

let connection = null;
let publicKey = null;

function solanaWeb3() {
    if (!window.solanaWeb3) throw new Error('solanaWeb3 not loaded');
    return window.solanaWeb3;
}

function getProvider() {
    if (window.solana && window.solana.isPhantom) return window.solana;
    if (window.backpack) return window.backpack;
    return null;
}

function ensureConnection() {
    if (!connection) connection = new (solanaWeb3().Connection)(DEVNET_URL, 'confirmed');
    return connection;
}

function truncateAddr(addr) {
    return addr.slice(0, 4) + '...' + addr.slice(-4);
}

function showConnected(addr) {
    const btn = document.getElementById('btn-connect-wallet');
    const box = document.getElementById('wallet-connected');
    if (btn) btn.classList.add('d-none');
    if (box) box.classList.remove('d-none');
    const short = document.getElementById('wallet-display-addr');
    const full = document.getElementById('wallet-full-addr');
    if (short) short.textContent = truncateAddr(addr);
    if (full) full.textContent = addr;
    document.dispatchEvent(new CustomEvent('walletConnected', { detail: { address: addr } }));
}

function showDisconnected() {
    const btn = document.getElementById('btn-connect-wallet');
    const box = document.getElementById('wallet-connected');
    if (btn) btn.classList.remove('d-none');
    if (box) box.classList.add('d-none');
    const sol = document.getElementById('wallet-sol-bal');
    const usdc = document.getElementById('wallet-usdc-bal');
    if (sol) sol.textContent = '';
    if (usdc) usdc.textContent = '';
    document.dispatchEvent(new CustomEvent('walletDisconnected'));
}

async function fetchBalances(pubKey) {
    const sw = solanaWeb3();
    const conn = ensureConnection();
    try {
        const lamports = await conn.getBalance(pubKey);
        const solEl = document.getElementById('wallet-sol-bal');
        if (solEl) solEl.textContent = (lamports / 1e9).toFixed(2) + ' SOL';
    } catch (e) {
        const solEl = document.getElementById('wallet-sol-bal');
        if (solEl) solEl.textContent = '? SOL';
    }

    try {
        const mintPubkey = new sw.PublicKey(USDC_MINT);
        const resp = await conn.getTokenAccountsByOwner(pubKey, { mint: mintPubkey }, 'confirmed');
        const usdcEl = document.getElementById('wallet-usdc-bal');
        if (!usdcEl) return;
        if (resp.value.length > 0) {
            const amount = resp.value[0].account.data.readBigUInt64LE(64);
            const usdc = (Number(amount) / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            usdcEl.textContent = '$' + usdc + ' USDC';
        } else {
            usdcEl.textContent = '';
        }
    } catch (e) {
        const usdcEl = document.getElementById('wallet-usdc-bal');
        if (usdcEl) usdcEl.textContent = '';
    }
}

async function connect() {
    const provider = getProvider();
    if (!provider) {
        alert('Phantom Wallet not detected.\nInstall at: https://phantom.app');
        return;
    }
    try {
        const resp = await provider.connect();
        publicKey = resp.publicKey;
        const addr = publicKey.toBase58();
        localStorage.setItem('gf_wallet_connected', 'true');
        localStorage.setItem('gf_wallet_address', addr);
        showConnected(addr);
        fetchBalances(publicKey);
    } catch (err) {
        console.warn('Wallet connection rejected:', err);
    }
}

async function disconnect() {
    const provider = getProvider();
    if (provider) {
        try { await provider.disconnect(); } catch (e) { /* ignore */ }
    }
    publicKey = null;
    localStorage.removeItem('gf_wallet_connected');
    localStorage.removeItem('gf_wallet_address');
    showDisconnected();
    closeDropdown();
}

async function autoReconnect() {
    if (localStorage.getItem('gf_wallet_connected') !== 'true') return;
    const provider = getProvider();
    if (!provider) return;
    try {
        const resp = await provider.connect({ onlyIfTrusted: true });
        publicKey = resp.publicKey;
        const addr = publicKey.toBase58();
        localStorage.setItem('gf_wallet_address', addr);
        showConnected(addr);
        fetchBalances(publicKey);
    } catch (e) {
        localStorage.removeItem('gf_wallet_connected');
        localStorage.removeItem('gf_wallet_address');
    }
}

function toggleDropdown(e) {
    if (e) e.stopPropagation();
    const dd = document.getElementById('wallet-dropdown');
    if (dd) dd.classList.toggle('show');
}

function closeDropdown() {
    const dd = document.getElementById('wallet-dropdown');
    if (dd) dd.classList.remove('show');
}

function copyAddress() {
    const addr = localStorage.getItem('gf_wallet_address') || '';
    navigator.clipboard.writeText(addr).then(() => {
        const btn = event && event.currentTarget;
        if (!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check me-2"></i>Copied!';
        setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
}

function isConnected() { return publicKey !== null; }
function getAddress() { return publicKey ? publicKey.toBase58() : null; }

async function signAndSendMemo(memoText) {
    const provider = getProvider();
    if (!provider || !publicKey) throw new Error('Wallet not connected');
    const sw = solanaWeb3();
    const conn = ensureConnection();
    const blockhashInfo = await conn.getLatestBlockhash('confirmed');
    const tx = new sw.Transaction({
        recentBlockhash: blockhashInfo.blockhash,
        feePayer: publicKey,
    });
    tx.add(new sw.TransactionInstruction({
        keys: [],
        programId: new sw.PublicKey(MEMO_PROGRAM),
        data: new TextEncoder().encode(memoText),
    }));
    const signed = await provider.signAndSendTransaction(tx);
    const sig = signed.signature || signed;
    try {
        await conn.confirmTransaction({
            signature: sig,
            blockhash: blockhashInfo.blockhash,
            lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
        }, 'confirmed');
    } catch (e) {
        console.warn('Confirmation failed', e);
    }
    return { txHash: sig };
}

function signLoanRequest(payload) {
    return signAndSendMemo('GF-LOAN-REQ:' + JSON.stringify({
        asset: payload.assetId,
        currency: payload.currency,
        amount: payload.amount,
        term: payload.termMonths,
    }));
}

function signPayment(payload) {
    return signAndSendMemo('GF-PAY:' + JSON.stringify({
        loan: payload.loanCode,
        escrow: payload.escrow,
        amount: payload.amount,
        currency: payload.currency,
    }));
}

// Base58 encoder (minimal, for signature bytes → Solana format)
const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes) {
    if (bytes.length === 0) return '';
    let zeros = 0;
    while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
    // BigInt approach
    let num = 0n;
    for (const b of bytes) num = (num << 8n) + BigInt(b);
    let result = '';
    while (num > 0n) {
        const mod = Number(num % 58n);
        result = B58_ALPHABET[mod] + result;
        num = num / 58n;
    }
    return '1'.repeat(zeros) + result;
}

function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

async function signInWithSolana() {
    const provider = getProvider();
    if (!provider) {
        throw new Error('Solana wallet not detected. Install Phantom or Backpack.');
    }
    // Connect if not connected
    if (!publicKey) {
        const resp = await provider.connect();
        publicKey = resp.publicKey;
        localStorage.setItem('gf_wallet_connected', 'true');
        localStorage.setItem('gf_wallet_address', publicKey.toBase58());
        showConnected(publicKey.toBase58());
        fetchBalances(publicKey);
    }

    // 1. Fetch challenge
    const challengeRes = await fetch('/auth/siws/challenge', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
    });
    if (!challengeRes.ok) throw new Error('Challenge request failed');
    const { nonce, message } = await challengeRes.json();

    // 2. Sign message with wallet
    const encoded = new TextEncoder().encode(message);
    const signed = await provider.signMessage(encoded, 'utf8');
    const signatureBytes = signed.signature || signed;
    const signatureB58 = base58Encode(signatureBytes);

    // 3. Verify
    const verifyRes = await fetch('/auth/siws/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            nonce,
            pubkey: publicKey.toBase58(),
            signature: signatureB58,
        }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
        throw new Error('SIWS verify failed: ' + (verifyData.error || verifyRes.status));
    }
    return verifyData;
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#wallet-connected')) closeDropdown();
});
document.addEventListener('DOMContentLoaded', autoReconnect);

const GFWallet = {
    connect,
    disconnect,
    toggleDropdown,
    copyAddress,
    isConnected,
    getAddress,
    signLoanRequest,
    signPayment,
    signAndSendMemo,
    signInWithSolana,
};
window.GFWallet = GFWallet;
export default GFWallet;
