// Admin Dashboard — loans by status donut chart
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('loans-by-status');
    if (!canvas) return;

    const dataEl = document.getElementById('loans-by-status-data');
    if (!dataEl) return;
    const raw = JSON.parse(dataEl.textContent);
    const labels = Object.keys(raw);
    const values = Object.values(raw);
    const colors = {
        pending_custody: '#F39C12',
        active: '#C9A84C',
        overdue: '#E57971',
        defaulted: '#5B554B',
        repaid: '#E8C96B',
    };

    new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels.map((k) => k.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())),
            datasets: [{
                data: values,
                backgroundColor: labels.map((k) => colors[k] || '#6B6458'),
                borderColor: '#0D0D0D',
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#9A9285', boxWidth: 12, font: { size: 11 } } },
            },
        },
    });
});
