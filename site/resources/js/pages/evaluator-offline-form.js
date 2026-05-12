// Evaluator Offline — progressive enhancement for the physical inspection form.
// - Color-codes the authenticity verdict.
// - Warns when timing rate is outside ±15 s/day (typical service threshold for COSC-grade movements).
// - Highlights serial-match dropdown red when "No" is selected.

function wireAuthenticityColor() {
    const sel = document.getElementById('authenticity');
    if (!sel) return;
    const palette = {
        authentic: { bg: 'rgba(201,168,76,.12)', color: '#C9A84C' },
        suspect: { bg: 'rgba(255,140,0,.14)', color: '#FF8C00' },
        replica: { bg: 'rgba(229,121,113,.16)', color: '#E57971' },
    };
    const apply = () => {
        const p = palette[sel.value];
        if (!p) return;
        sel.style.background = p.bg;
        sel.style.color = p.color;
        sel.style.fontWeight = '600';
    };
    sel.addEventListener('change', apply);
    apply();
}

function wireTimingWarning() {
    const input = document.getElementById('timing_rate');
    if (!input) return;
    let helper = document.createElement('small');
    helper.className = 'd-block mt-1';
    helper.style.minHeight = '1em';
    input.parentNode.appendChild(helper);

    const check = () => {
        const v = parseFloat(input.value);
        if (Number.isNaN(v)) {
            helper.textContent = '';
            return;
        }
        if (Math.abs(v) > 15) {
            helper.textContent = `⚠ Outside COSC tolerance (${v > 0 ? '+' : ''}${v}s/day) — consider service before final value`;
            helper.style.color = '#E57971';
        } else if (Math.abs(v) > 6) {
            helper.textContent = `↻ Within tolerance but trending high (${v > 0 ? '+' : ''}${v}s/day)`;
            helper.style.color = '#FF8C00';
        } else {
            helper.textContent = `✓ Within COSC band (${v > 0 ? '+' : ''}${v}s/day)`;
            helper.style.color = '#C9A84C';
        }
    };
    input.addEventListener('input', check);
    check();
}

function wireSerialMatch() {
    const sel = document.getElementById('serial_match');
    if (!sel) return;
    const apply = () => {
        if (sel.value === '0') {
            sel.style.background = 'rgba(229,121,113,.16)';
            sel.style.color = '#E57971';
            sel.style.fontWeight = '600';
        } else {
            sel.style.background = '';
            sel.style.color = '';
            sel.style.fontWeight = '';
        }
    };
    sel.addEventListener('change', apply);
    apply();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('form[action*="/evaluator/offline/"]')) return;
    wireAuthenticityColor();
    wireTimingWarning();
    wireSerialMatch();
});
