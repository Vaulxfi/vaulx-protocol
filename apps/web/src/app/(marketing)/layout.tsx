import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

/**
 * Marketing route-group layout. Mirrors Laravel `layouts/app.blade.php`:
 * sticky nav, page content, footer. Head metadata is owned by the root
 * layout; per-route metadata exports override per page.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </>
  );
}
