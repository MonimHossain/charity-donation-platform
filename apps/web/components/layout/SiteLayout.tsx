import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
        <main className="flex-1 overflow-visible">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
