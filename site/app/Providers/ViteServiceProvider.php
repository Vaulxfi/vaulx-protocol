<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class ViteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Blade::directive('vite', function (string $expression) {
            return "<?php echo \\App\\Providers\\ViteServiceProvider::vite({$expression}); ?>";
        });
    }

    public static function vite(array|string $entries): string
    {
        $entries = (array) $entries;
        $hotFile = public_path('hot');
        $buildDir = 'build';

        if (file_exists($hotFile)) {
            $host = trim((string) file_get_contents($hotFile));
            $tags = '<script type="module" src="' . rtrim($host, '/') . '/@vite/client"></script>';
            foreach ($entries as $entry) {
                if (str_ends_with($entry, '.css')) {
                    $tags .= '<link rel="stylesheet" href="' . rtrim($host, '/') . '/' . ltrim($entry, '/') . '">';
                } else {
                    $tags .= '<script type="module" src="' . rtrim($host, '/') . '/' . ltrim($entry, '/') . '"></script>';
                }
            }
            return $tags;
        }

        $manifestPath = public_path($buildDir . '/manifest.json');
        if (!file_exists($manifestPath)) {
            return '<!-- Vite manifest missing; run: npm run build -->';
        }
        $manifest = json_decode((string) file_get_contents($manifestPath), true) ?: [];

        $tags = '';
        foreach ($entries as $entry) {
            $info = $manifest[$entry] ?? null;
            if (!$info) continue;
            $file = asset($buildDir . '/' . $info['file']);
            if (str_ends_with($info['file'], '.css')) {
                $tags .= '<link rel="stylesheet" href="' . $file . '">';
            } else {
                $tags .= '<script type="module" src="' . $file . '"></script>';
            }
            foreach ($info['css'] ?? [] as $css) {
                $tags .= '<link rel="stylesheet" href="' . asset($buildDir . '/' . $css) . '">';
            }
        }
        return $tags;
    }
}
