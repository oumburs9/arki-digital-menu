import { useEffect } from "react";
import Icon, { type IconName } from "../components/Icon";
import { TENANTS } from "../data/seed";
import { appearanceAttrs, THEMES } from "../lib/appearance";
import { asset, href, navigate } from "../lib/router";

const FEATURES: [IconName, string, string][] = [
  ["globe", "Amharic & English", "Guests switch language with one tap."],
  ["coffee", "Options inside each item", "Light or dark macchiato, sizes and extras in one place, not separate lines."],
  ["leaf", "Fasting & dietary filters", "Fasting, vegetarian and allergen filters, with fasting options per item."],
  ["qr", "QR table ordering", "Each table has its own code; orders go straight to the owner’s screen."],
  ["zap", "Live sold-out", "Mark an item sold out and every guest’s menu updates instantly."],
  ["trending", "Upselling & analytics", "Smart “goes well with” suggestions and per-item numbers for the owner."],
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
        <a className="btn-ghost small" href={href("/admin")} onClick={(e) => go(e, "/admin")}>
          <Icon name="lock" size={15} /> Arki console
        </a>
      </header>

      <section className="h-hero">
        <p className="eyebrow">
          <span className="eyebrow-dot" /> Arki hospitality platform · Layer 1
        </p>
        <h1>
          A digital menu that <em>takes the order</em>, not just shows it.
        </h1>
        <p className="lead">QR menus in Amharic and English with table ordering, live sold-out, fasting filters and analytics. Every feature can be switched on or off for each business, from a small café to a hotel.</p>
      </section>

      <section className="h-demos" aria-label="Live demos">
        {TENANTS.map((t) => {
          const th = THEMES[t.appearance.theme];
          return (
            <article key={t.slug} className="demo-card">
              <div className="demo-cover" {...appearanceAttrs(t.appearance)}>
                <span className="demo-mark">{t.name.en[0]}</span>
                <span className="plan">{t.plan}</span>
              </div>
              <div className="demo-body">
                <h2>{t.name.en}</h2>
                <p className="muted">{t.tagline.en}</p>
                <p className="demo-theme">
                  <span className="swatches sm" aria-hidden>
                    {th.swatch.map((c) => (
                      <span key={c} style={{ background: c }} />
                    ))}
                  </span>
                  {th.name} theme
                </p>
                <div className="demo-actions">
                  <a className="btn-primary" href={href(`/m/${t.slug}?t=5`)} onClick={(e) => go(e, `/m/${t.slug}?t=5`)}>
                    <Icon name="utensils" size={17} /> Guest menu
                  </a>
                  <a className="btn-ghost" href={href(`/owner/${t.slug}`)} onClick={(e) => go(e, `/owner/${t.slug}`)}>
                    <Icon name="grid" size={17} /> Owner panel
                  </a>
                </div>
                <p className="demo-login">
                  Owner login: <code>{t.owner.email}</code> / <code>{t.owner.password}</code>
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="h-features" aria-label="Features">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="feat">
            <span className="feat-ic" aria-hidden>
              <Icon name={icon} size={20} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <section className="h-tip">
        <Icon name="sparkles" size={20} />
        <p>
          <strong>Try it live:</strong> open the guest menu and the owner panel in two tabs of the same browser. Place an order, then mark an item sold out and watch both update. Arki staff can set each menu's look in the{" "}
          <a href={href("/admin")} onClick={(e) => go(e, "/admin")}>
            Arki console
          </a>
          . (This demo keeps data in the browser; the full platform syncs across devices.)
        </p>
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
