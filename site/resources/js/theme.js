// GFTheme — light/dark switcher with localStorage persistence

const KEY = 'gf_theme';

function getSavedTheme() {
    return localStorage.getItem(KEY);
}

function apply(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

function toggle() {
    const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
}

function init() {
    const saved = getSavedTheme();
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    apply(saved || prefers);

    document.addEventListener('click', (e) => {
        const t = e.target.closest('#theme-toggle');
        if (t) { e.preventDefault(); toggle(); }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.GFTheme = { toggle, apply };
