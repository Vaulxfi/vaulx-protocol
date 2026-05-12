// Monitor BRZ page — live polling + sparkline
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function n(v, d) { return (Number(v) || 0).toFixed(d); }

let chart = null;

function ensureChart(labels, data) {
    const canvas = document.getElementById('depeg-chart');
    if (!canvas) return;
    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update('none');
        return;
    }
    chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Depeg %',
                data,
                borderColor: 'rgb(108,60,224)',
                backgroundColor: 'rgba(108,60,224,0.08)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    suggestedMin: -5,
                    suggestedMax: 1,
                    ticks: { callback: (v) => v.toFixed(1) + '%' },
                    grid: { color: 'rgba(128,128,128,0.1)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 8 }
                }
            }
        }
    });
}

function render(data) {
    document.getElementById('m-brz-usd').textContent = '$' + n(data.brz_usd, 4);
    document.getElementById('m-usd-brl').textContent = 'R$ ' + n(data.usd_brl, 4);
    document.getElementById('m-brz-brl').textContent = 'R$ ' + n(data.brz_brl, 4);

    const depeg = parseFloat(data.depeg_pct) || 0;
    const card = document.getElementById('m-depeg-card');
    const depegEl = document.getElementById('m-depeg');
    const labelEl = document.getElementById('m-tier-label');
    card.style.borderLeft = '4px solid ' + data.color;
    depegEl.className = 'fw-bold mb-1 ' + (depeg >= 0 ? 'text-success' : (depeg < -3 ? 'text-danger' : 'text-warning'));
    depegEl.textContent = (depeg >= 0 ? '+' : '') + depeg.toFixed(2) + '%';
    labelEl.innerHTML = '<i class="bi bi-info-circle me-1"></i>' + (data.action || '');
    labelEl.style.color = data.color;

    document.querySelectorAll('.tier-row').forEach((row) => {
        const active = row.dataset.tier === data.tier;
        row.classList.toggle('active', active);
        const badge = row.querySelector('.tier-badge');
        badge.textContent = active ? 'ACTIVE' : 'STANDBY';
        badge.className = 'badge px-2 py-1 tier-badge ' + (active ? 'bg-success' : 'bg-secondary');
    });

    const body = document.getElementById('history-body');
    if (data.history && data.history.length) {
        body.innerHTML = data.history.map((h) => {
            const color = h.depeg_pct >= 0 ? 'text-success' : (h.depeg_pct < -3 ? 'text-danger' : 'text-warning');
            return `<tr>
                <td class="text-muted">${h.time}</td>
                <td>$${Number(h.brz_usd).toFixed(4)}</td>
                <td>R$ ${Number(h.brz_brl).toFixed(4)}</td>
                <td class="fw-semibold ${color}">${h.depeg_pct >= 0 ? '+' : ''}${Number(h.depeg_pct).toFixed(2)}%</td>
                <td><span class="badge bg-light text-dark">${h.tier || 'normal'}</span></td>
            </tr>`;
        }).join('');

        const reversed = [...data.history].reverse();
        const labels = reversed.map((h) => h.time);
        const values = reversed.map((h) => Number(h.depeg_pct));
        ensureChart(labels, values);
    } else {
        body.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No readings yet.</td></tr>';
    }
}

async function refresh() {
    const badge = document.getElementById('monitor-status-badge');
    try {
        const res = await fetch('/api/rates/brz-monitor?history=24', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        render(data);
        badge.className = 'badge bg-success px-2 py-1';
        badge.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;animation:pulse-dot 2s infinite;vertical-align:middle" class="me-1"></span>Monitoring';
    } catch (e) {
        console.warn(e);
        badge.className = 'badge bg-danger px-2 py-1';
        badge.textContent = 'Connection error';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-refresh-now');
    if (btn) btn.addEventListener('click', refresh);
    refresh();
    setInterval(refresh, 60_000);
});
