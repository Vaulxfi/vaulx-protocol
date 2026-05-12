// Evaluator Online — progressive enhancement for the report form.
// - Auto-derives the overall grade from the 5 sub-grades (lowest sub-grade wins).
// - Pulses the "blind" reminder so the evaluator does not forget context.
// - Adds a tiny lightbox on photo thumbnails.

const GRADE_RANK = { mint: 0, ex: 1, vg: 2, g: 3, f: 4 };
const RANK_TO_GRADE = ['mint', 'ex', 'vg', 'g', 'f'];

function lowestGrade(values) {
    let worst = 0;
    for (const v of values) {
        const r = GRADE_RANK[v];
        if (typeof r === 'number' && r > worst) worst = r;
    }
    return RANK_TO_GRADE[worst];
}

function wireGradeAggregation() {
    const overall = document.getElementById('grade');
    if (!overall) return;
    const subFields = ['dial', 'case', 'bracelet', 'glass', 'crown']
        .map((p) => document.getElementById(`${p}_grade`))
        .filter(Boolean);
    if (!subFields.length) return;

    const recompute = () => {
        const values = subFields.map((el) => el.value);
        const auto = lowestGrade(values);
        // Only override if user hasn't manually changed overall (track via dataset flag).
        if (overall.dataset.touched !== '1') {
            overall.value = auto;
        }
    };
    subFields.forEach((el) => el.addEventListener('change', recompute));
    overall.addEventListener('change', () => {
        overall.dataset.touched = '1';
    });
    recompute();
}

function wireBlindBanner() {
    const banner = document.querySelector('.alert-warning');
    if (!banner) return;
    banner.style.transition = 'box-shadow .6s ease-in-out';
    let on = true;
    setInterval(() => {
        banner.style.boxShadow = on ? '0 0 0 3px rgba(255,140,0,.18)' : 'none';
        on = !on;
    }, 1400);
}

function wirePhotoLightbox() {
    document.querySelectorAll('a[target="_blank"] > img').forEach((img) => {
        img.style.cursor = 'zoom-in';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('form[action*="/evaluator/online/"]')) return;
    wireGradeAggregation();
    wireBlindBanner();
    wirePhotoLightbox();
});
