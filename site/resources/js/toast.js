// GFToast — bootstrap toast helper

let container;

function ensure() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1080';
    document.body.appendChild(container);
    return container;
}

function show(msg, variant = 'success', delay = 4000) {
    ensure();
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${variant} border-0 show`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${msg}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), delay);
}

const GFToast = {
    success: (m) => show(m, 'success'),
    danger:  (m) => show(m, 'danger', 6000),
    warning: (m) => show(m, 'warning', 5000),
    info:    (m) => show(m, 'info'),
};
window.GFToast = GFToast;
export default GFToast;
