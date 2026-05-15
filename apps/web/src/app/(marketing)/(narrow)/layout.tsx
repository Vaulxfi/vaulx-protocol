/**
 * Narrow-content layout shared by `/faq` and `/terms`. Mirrors Laravel's
 * `<div class="container py-5" style="max-width:860px">` wrapper used on
 * both views (`site/resources/views/faq.blade.php:5`,
 * `site/resources/views/terms.blade.php:5`).
 *
 * Nested inside the `(marketing)` route group, so the parent MarketingNav
 * and MarketingFooter still wrap each page.
 */
export default function NarrowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-[3rem] md:px-6">
      {children}
    </div>
  );
}
