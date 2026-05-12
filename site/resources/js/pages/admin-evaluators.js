// Admin Evaluators — tier distribution doughnut chart over both layers.
// Reads tier badges from the rendered tables; no extra endpoint needed.

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const TIER_COLORS = {
    1: '#5B554B', // muted
    2: '#9A9285',
    3: '#E8C96B', // champagne
    4: '#C9A84C', // gold
};

function readTierCountsFromTable(tableEl) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    if (!tableEl) return counts;
    tableEl.querySelectorAll('tbody tr').forEach((row) => {
        const badge = row.querySelector('.badge');
        if (!badge) return;
        const m = badge.textContent.trim().match(/Tier\s+(\d)/i);
        if (!m) return;
        const tier = parseInt(m[1], 10);
        if (counts[tier] !== undefined) counts[tier]++;
    });
    return counts;
}

function mountChart(canvas, counts, title) {
    const labels = Object.keys(counts).map((t) => `Tier ${t}`);
    const data = Object.values(counts);
    if (data.every((v) => v === 0)) {
        canvas.parentNode.innerHTML = `<div class="text-muted small text-center p-3">No ${title.toLowerCase()} data yet.</div>`;
        return;
    }
    new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: Object.keys(counts).map((t) => TIER_COLORS[t]),
                borderColor: '#0D0D0D',
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9A9285', boxWidth: 10, font: { size: 11 } } },
                title: { display: true, text: title, color: '#E8E5DC', font: { size: 12, weight: '600' } },
            },
        },
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const onlineCanvas = document.getElementById('tier-online');
    const offlineCanvas = document.getElementById('tier-offline');
    if (!onlineCanvas && !offlineCanvas) return;

    const tables = document.querySelectorAll('table');
    // Heuristic: first table = online, second = offline (matches view order).
    if (onlineCanvas && tables[0]) mountChart(onlineCanvas, readTierCountsFromTable(tables[0]), 'Online tiers');
    if (offlineCanvas && tables[1]) mountChart(offlineCanvas, readTierCountsFromTable(tables[1]), 'Offline tiers');
});
