import { useEffect } from "react";
import { TENANTS } from "../data/seed";
import { asset, href, navigate } from "../lib/router";

const FEATURES = [
  ["🌍", "Amharic & English", "Guests switch language with one tap."],
  ["☕", "Options inside each item", "Light or dark macchiato, sizes and extras in one place, not separate lines."],
  ["🌿", "Fasting & dietary filters", "Fasting, vegetarian and allergen filters, with fasting options per item."],
  ["🛎", "QR table ordering", "Each table has its own code; orders go straight to the owner’s screen."],
  ["⚡", "Live sold-out", "Mark an item sold out and every guest’s menu updates instantly."],
  ["📈", "Upselling & analytics", "Smart “goes well with” suggestions and per-item numbers for the owner."],
];

export default function Home() {
  useEffect(() => {
    document.title = "Arki Menu · Digital menu demo";
  }, []);
  const go = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault();
    navigate(to);
  };
  return (
    <div className="home">
      <header className="h-header">
        <img src={asset("arki-logo.png")} alt="Arki Tech Solutions" />
      </header>
      <section className="h-hero">
        <p className="eyebrow">Arki hospitality platform · Layer 1</p>
        <h1>
          A digital menu that <span>takes the order</span>, not just shows it.
        </h1>
        <p className="lead">QR menus in Amharic and English with table ordering, live sold-out, fasting filters and analytics. Every feature can be switched on or off for each business, from a small café to a hotel.</p>
      </section>

      <section className="h-demos">
        {TENANTS.map((t) => (
          <article key={t.slug} className="demo-card">
            <div className="demo-top">
              <div className="m-logo">{t.name.en[0]}</div>
              <div>
                <h2>{t.name.en}</h2>
                <p className="muted">{t.tagline.en}</p>
              </div>
              <span className="plan">{t.plan}</span>
            </div>
            <div className="demo-actions">
              <a className="btn-primary" href={href(`/m/${t.slug}?t=5`)} onClick={(e) => go(e, `/m/${t.slug}?t=5`)}>
                Guest menu (table 5)
              </a>
              <a className="btn-ghost" href={href(`/owner/${t.slug}`)} onClick={(e) => go(e, `/owner/${t.slug}`)}>
                Owner panel
              </a>
            </div>
            <p className="demo-login">
              Owner login: <code>{t.owner.email}</code> / <code>{t.owner.password}</code>
            </p>
          </article>
        ))}
      </section>

      <section className="h-features">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="feat">
            <span className="feat-ic">{icon}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <section className="h-tip">
        <strong>Try it live:</strong> open the guest menu and the owner panel in two tabs of the same browser. Place an order, then mark an item sold out and watch both update. (This demo keeps data in the browser; the full platform syncs across devices.)
      </section>

      <footer className="h-footer">
        <span>© 2026 Arki Tech Solutions PLC · Addis Ababa</span>
        <a href="https://arkisolutions.com" target="_blank" rel="noreferrer">
          arkisolutions.com
        </a>
      </footer>
    </div>
  );
}
