import { type ReactNode } from "react";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type StaticPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const StaticPageLayout = ({ eyebrow, title, description, children }: StaticPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <NotificationBar />
    <Header />
    <main className="container mx-auto px-4 py-12">
      <section className="border border-border bg-card p-6 shadow-sm md:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[0.06em] text-foreground">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </section>

      <section className="mt-8 border border-border bg-card p-6 shadow-sm md:p-8">{children}</section>
    </main>
    <Footer />
  </div>
);

export default StaticPageLayout;
