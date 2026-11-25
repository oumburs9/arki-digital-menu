import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { TENANTS } from "../data/seed";
import { CORNERS, HEADINGS, LAYOUTS, THEMES, encodeAppearance } from "../lib/appearance";
import { href, navigate } from "../lib/router";
import { repo, useTenantState } from "../lib/store";
import type { Appearance, ThemeId } from "../types";
import { AuthShell } from "./Owner";

/** Demo super-admin account for the Arki console. In production this is Arki staff SSO. */
const ADMIN = { email: "admin@arki.demo", password: "arki-admin", name: "Arki delivery team" };
const AUTH_KEY = "arki-admin";

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  useEffect(() => {
    document.title = "Arki console · Appearance";
  }, []);
  if (!authed) return <AdminLogin onOk={() => (sessionStorage.setItem(AUTH_KEY, "1"), setAuthed(true))} />;
  return <Console onLogout={() => (sessionStorage.removeItem(AUTH_KEY), setAuthed(false))} />;
}

function AdminLogin({ onOk }: { onOk: () => void }) {
  const [email, setEmail] = useState(ADMIN.email);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <AuthShell
      title="Arki console"
      subtitle="Super admin sign-in"
      aside={
        <>
          <p className="auth-kicker">Super admin</p>
          <h2>Deliver every menu with the right look.</h2>
          <ul>
            <li>
              <Icon name="layers" size={18} /> Five themes with serif or sans headings
            </li>
            <li>
              <Icon name="grid" size={18} /> List or grid menus, soft to sharp corners
            </li>
            <li>
              <Icon name="lock" size={18} /> Locked for owners once applied
            </li>
          </ul>
        </>
      }
    >
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim().toLowerCase() === ADMIN.email && pw === ADMIN.password) onOk();
          else setErr("Wrong email or password.");
        }}
      >
        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input type="password" value={pw} onChange={(e) => (setPw(e.target.value), setErr(""))} autoComplete="current-password" required aria-invalid={!!err} />
        </label>
        {err && (
          <p className="error" role="alert">
            <Icon name="alert" size={16} /> {err}
          </p>
        )}
        <button className="btn-primary" type="submit">
          Sign in
        </button>
        <p className="demo-hint">
          Demo login: <code>{ADMIN.email}</code> / <code>{ADMIN.password}</code>
        </p>
      </form>
    </AuthShell>
  );
}

function Console({ onLogout }: { onLogout: () => void }) {
  const [slug, setSlug] = useState(TENANTS[0].slug);
  return (
    <div className="dash">
      <aside className="dash-side">
        <div className="dash-brand">
          <div className="dash-mark admin" aria-hidden>
            <Icon name="layers" size={20} />
          </div>
          <div>
            <strong>Arki console</strong>
            <span>Super admin</span>
          </div>
        </div>
        <nav className="dash-nav" aria-label="Businesses">
          <p className="nav-group">Businesses</p>
          {TENANTS.map((t) => (
            <button key={t.slug} className={slug === t.slug ? "on" : ""} aria-current={slug === t.slug ? "page" : undefined} onClick={() => setSlug(t.slug)}>
              <Icon name={t.type === "hotel" ? "hotel" : "coffee"} size={19} />
              <span>{t.name.en}</span>
            </button>
          ))}
        </nav>
        <div className="dash-side-foot">
          <button className="side-link" onClick={() => navigate("/")}>
            <Icon name="grid" size={17} /> All demos
          </button>
          <button className="side-link" onClick={onLogout}>
            <Icon name="logout" size={17} /> Sign out
          </button>
        </div>
      </aside>
      <main className="dash-main">
        <AppearanceEditor key={slug} slug={slug} onLogout={onLogout} />
      </main>
    </div>
  );
}

function AppearanceEditor({ slug, onLogout }: { slug: string; onLogout: () => void }) {
  const tenant = TENANTS.find((t) => t.slug === slug)!;
  const s = useTenantState(slug);
  const [draft, setDraft] = useState<Appearance>(s.appearance);
  const [saved, setSaved] = useState(false);
  const live = s.appearance;
  const dirty = draft.theme !== live.theme || draft.headings !== live.headings || draft.layout !== live.layout || draft.corners !== live.corners;
  const set = <K extends keyof Appearance>(k: K, v: Appearance[K]) => (setDraft((d) => ({ ...d, [k]: v })), setSaved(false));

  const apply = () => {
    repo.setAppearance(slug, draft, ADMIN.name);
    setSaved(true);
  };

  return (
    <>
      <header className="dash-head">
        <div>
          <p className="dash-kicker">
            {tenant.name.en} · {tenant.plan} plan
          </p>
          <h1>Appearance</h1>
        </div>
        <div className="dash-head-actions">
          <a className="btn-ghost small" href={href(`/m/${slug}?t=1`)} target="_blank" rel="noreferrer">
            <Icon name="external" size={16} /> Live menu
          </a>
          <button className="btn-ghost small icon-only hide-lg" onClick={onLogout} aria-label="Sign out">
            <Icon name="logout" size={17} />
          </button>
        </div>
      </header>

      <div className="dash-body admin-grid">
        <div className="admin-controls">
          <section className="panel">
            <h2 className="panel-title">Theme</h2>
            <div className="theme-grid" role="radiogroup" aria-label="Theme">
              {(Object.keys(THEMES) as ThemeId[]).map((id) => {
                const th = THEMES[id];
                return (
                  <label key={id} className={`theme-card ${draft.theme === id ? "on" : ""}`}>
                    <input type="radio" name="theme" checked={draft.theme === id} onChange={() => set("theme", id)} />
                    <span className="theme-swatch" aria-hidden>
                      {th.swatch.map((c) => (
                        <span key={c} style={{ background: c }} />
                      ))}
                    </span>
                    <span className="theme-text">
                      <strong>
                        {th.name} {th.dark && <span className="status-pill st-dark">Dark</span>}
                      </strong>
                      <span>{th.mood}</span>
                    </span>
                    {draft.theme === id && (
                      <span className="theme-check" aria-hidden>
                        <Icon name="check" size={14} strokeWidth={3} />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title">Advanced</h2>
            <Segment label="Headings" value={draft.headings} options={HEADINGS} onChange={(v) => set("headings", v)} />
            <Segment label="Menu layout on phones" value={draft.layout} options={LAYOUTS} onChange={(v) => set("layout", v)} />
            <Segment label="Corners" value={draft.corners} options={CORNERS} onChange={(v) => set("corners", v)} />
          </section>

          <section className="panel apply-panel">
            <div>
              <strong>{dirty ? "Unsaved changes" : saved ? "Applied to the live menu" : "This is the live appearance"}</strong>
              <p className="muted">
                {live.appliedAt
                  ? `Last applied ${new Date(live.appliedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} by ${live.appliedBy ?? "Arki"}.`
                  : "Delivered default. Applying locks it for the owner, who sees it as “Managed by Arki”."}
              </p>
            </div>
            <div className="apply-actions">
              <button className="btn-ghost" disabled={!dirty} onClick={() => setDraft(live)}>
                Revert
              </button>
              <button className="btn-primary" disabled={!dirty} onClick={apply}>
                <Icon name="check" size={17} strokeWidth={2.4} /> Apply on delivery
              </button>
            </div>
          </section>
        </div>

        <div className="admin-preview">
          <div className="preview-head">
            <span className="muted">Preview · guest phone</span>
            {dirty && <span className="status-pill st-new">Draft</span>}
          </div>
          <div className="phone">
            <iframe title={`Preview of ${tenant.name.en} menu`} src={href(`/m/${slug}?t=1&preview=${encodeAppearance(draft)}`)} />
          </div>
        </div>
      </div>
    </>
  );
}

function Segment<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <fieldset className="segment-field">
      <legend>{label}</legend>
      <div className="segment">
        {(Object.keys(options) as T[]).map((k) => (
          <label key={k} className={value === k ? "on" : ""}>
            <input type="radio" name={label} checked={value === k} onChange={() => onChange(k)} />
            <span>{options[k]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
