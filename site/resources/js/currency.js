// GFCurrency — dynamic USD/BRL formatting + reactive rate fetch

const FMT = {
    USDC: { prefix: '$', locale: 'en-US', name: 'USDC' },
    BRZ:  { prefix: 'R$ ', locale: 'pt-BR', name: 'BRZ' },
};

const state = {
    usdBrl: (window.GF_CONFIG && window.GF_CONFIG.fallbackUsdBrl) || 5.18,
    brzUsd: 0,
    brzBrl: 0,
    lastFetch: 0,
    listeners: [],
};

function format(amount, currency = 'USDC') {
    const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    const cfg = FMT[currency] || FMT.USDC;
    return cfg.prefix + (amount || 0).toLocaleString(cfg.locale, opts);
}

function convert(amount, fromCurrency, toCurrency) {
    if (!amount || fromCurrency === toCurrency) return amount || 0;
    if (fromCurrency === 'USDC' && toCurrency === 'BRZ') return amount * state.usdBrl;
    if (fromCurrency === 'BRZ' && toCurrency === 'USDC') return state.usdBrl > 0 ? amount / state.usdBrl : 0;
    return amount;
}

function dual(amount, currency = 'USDC') {
    const other = currency === 'USDC' ? 'BRZ' : 'USDC';
    const converted = convert(amount, currency, other);
    return `${format(amount, currency)} (~ ${format(converted, other)})`;
}

function rate() {
    return {
        usdBrl: state.usdBrl,
        brzUsd: state.brzUsd,
        brzBrl: state.brzBrl,
        asOf: state.lastFetch,
    };
}

function onUpdate(cb) {
    state.listeners.push(cb);
}

function emitUpdate() {
    const current = rate();
    state.listeners.forEach(cb => {
        try { cb(current); } catch (e) { console.warn(e); }
    });
    document.dispatchEvent(new CustomEvent('gfCurrencyUpdate', { detail: current }));
}

async function refresh(force = false) {
    const now = Date.now();
    if (!force && now - state.lastFetch < 60_000) return rate();
    try {
        const res = await fetch('/api/rates', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (data.usd_brl) state.usdBrl = parseFloat(data.usd_brl);
        if (data.brz_usd) state.brzUsd = parseFloat(data.brz_usd);
        if (data.brz_brl) state.brzBrl = parseFloat(data.brz_brl);
        state.lastFetch = now;
        emitUpdate();
    } catch (e) {
        console.warn('GFCurrency: rate fetch failed', e);
    }
    return rate();
}

document.addEventListener('DOMContentLoaded', () => { refresh(); });

const GFCurrency = { format, convert, dual, rate, onUpdate, refresh };
window.GFCurrency = GFCurrency;
export default GFCurrency;
