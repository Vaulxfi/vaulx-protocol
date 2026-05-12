import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/js/pages/monitor-brz.js',
                'resources/js/pages/admin-dashboard.js',
                'resources/js/pages/evaluator-online-form.js',
                'resources/js/pages/evaluator-offline-form.js',
                'resources/js/pages/admin-evaluators.js',
            ],
            refresh: [
                'resources/views/**',
                'routes/**',
                'app/Http/Controllers/**',
            ],
        }),
    ],
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
    },
});
