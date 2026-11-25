import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import Icon, { categoryIcon, type IconName } from "../components/Icon";
import Photo from "../components/Photo";
import { CATEGORIES } from "../data/seed";
import { appearanceAttrs, CORNERS, HEADINGS, LAYOUTS, THEMES } from "../lib/appearance";
import { birr } from "../lib/i18n";
import { describeChoices } from "../lib/pricing";
import { asset, BASE, href, navigate } from "../lib/router";
import { getTenant, repo, useTenantState } from "../lib/store";
import { useDialog } from "../lib/useDialog";
import type { FeatureFlags, MenuItem, Order, OrderStatus } from "../types";

type Tab = "orders" | "menu" | "analytics" | "qr" | "settings";

const FEATURE_LABELS: Record<keyof FeatureFlags, [string, string, IconName]> = {
  ordering: ["QR table ordering", "Guests order and send to the kitchen from their table.", "qr"],
  amharic: ["Amharic menu", "Language switch between Amharic and English.", "globe"],
  photos: ["Item photos", "Show a photo for each item.", "eye"],
  filters: ["Fasting & dietary filters", "Fasting, vegetarian and allergen filters.", "leaf"],
  upselling: ["Upselling", "“Goes well with” suggestions on items and in the cart.", "sparkles"],
  liveSoldOut: ["Live sold-out", "Sold-out items update on guests’ phones instantly.", "zap"],
  callWaiter: ["Call waiter / bill", "Guests can call a waiter or ask for the bill.", "bell"],
  analytics: ["Menu analytics", "Track views, add-to-cart and orders per item.", "chart"],
  orderNotes: ["Order notes", "Guests can add notes like “no onion”.", "pencil"],
};

const ago = (ts: number) => {
  const m = Math.round((Date.now() - ts) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function OwnerPage({ slug }: { slug: string }) {
  const tenant = getTenant(slug)!;
  const authKey = `arki-owner:${slug}`;
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(authKey) === "1");
  useEffect(() => {
    document.title = `${tenant.name.en} · Owner`;
  }, [tenant]);
  if (!authed) return <Login slug={slug} onOk={() => (sessionStorage.setItem(authKey, "1"), setAuthed(true))} />;
  return <Dashboard slug={slug} onLogout={() => (sessionStorage.removeItem(authKey), setAuthed(false))} />;
}

function Login({ slug, onOk }: { slug: string; onOk: () => void }) {
  const tenant = getTenant(slug)!;
  const [email, setEmail] = useState(tenant.owner.email);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <AuthShell
      title="Owner login"
      subtitle={tenant.name.en}
      aside={
        <>
          <p className="auth-kicker">Owner panel</p>
          <h2>Run the floor from one screen.</h2>
          <ul>
            <li>
              <Icon name="orders" size={18} /> Live orders and waiter calls
            </li>
            <li>
              <Icon name="book" size={18} /> Sold-out and menu edits in seconds
            </li>
            <li>
              <Icon name="chart" size={18} /> What guests view, add and buy
            </li>
          </ul>
        </>
      }
    >
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim().toLowerCase() === tenant.owner.email && pw === tenant.owner.password) onOk();
          else setErr("Wrong email or password.");
        }}
      >
        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input type="password" value={pw} onChange={(e) => (setPw(e.target.value), setErr(""))} autoComplete="current-password" required aria-invalid={!!err} aria-describedby={err ? "login-err" : undefined} />
        </label>
        {err && (
          <p className="error" id="login-err" role="alert">
            <Icon name="alert" size={16} /> {err}
          </p>
        )}
        <button className="btn-primary" type="submit">
          Log in
        </button>
        <p className="demo-hint">
          Demo login: <code>{tenant.owner.email}</code> / <code>{tenant.owner.password}</code>
        </p>
      </form>
    </AuthShell>
  );
}

/** Shared split-screen layout for the owner and Arki admin logins. */
export function AuthShell({ title, subtitle, aside, children }: { title: string; subtitle: string; aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <img src={asset("arki-logo.png")} alt="Arki Tech Solutions" className="auth-logo" />
        <div className="auth-aside-body">{aside}</div>
        <p className="auth-foot">© 2026 Arki Tech Solutions · Addis Ababa</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <img src={asset("arki-logo.png")} alt="" className="auth-logo-sm" />
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <button className="link back-link" onClick={() => navigate("/")}>
            ← All demos
          </button>
        </div>
      </main>
    </div>
  );
}

function Dashboard({ slug, onLogout }: { slug: string; onLogout: () => void }) {
  const tenant = getTenant(slug)!;
  const s = useTenantState(slug);
  const [tab, setTab] = useState<Tab>("orders");
  const openOrders = s.orders.filter((o) => o.status === "new" || o.status === "preparing").length;
  const openCalls = s.calls.filter((c) => !c.done).length;

  const tabs: { k: Tab; label: string; icon: IconName; show: boolean; badge?: number }[] = [
    { k: "orders", label: "Live orders", icon: "orders", show: s.features.ordering || s.features.callWaiter, badge: openOrders + openCalls },
    { k: "menu", label: "Menu", icon: "book", show: true },
    { k: "analytics", label: "Analytics", icon: "chart", show: s.features.analytics },
    { k: "qr", label: "QR codes", icon: "qr", show: true },
    { k: "settings", label: "Settings", icon: "sliders", show: true },
  ];
  const shown = tabs.filter((x) => x.show);
  const current = shown.some((x) => x.k === tab) ? tab : "menu";
  const meta = shown.find((x) => x.k === current)!;

  return (
    <div className="dash">
      <aside className="dash-side">
        <div className="dash-brand">
          <div className="dash-mark" aria-hidden>
            {tenant.name.en[0]}
          </div>
          <div>
            <strong>{tenant.name.en}</strong>
            <span>
              <span className={`plan-dot plan-${tenant.plan}`} /> {tenant.plan} plan
            </span>
          </div>
        </div>
        <nav className="dash-nav" aria-label="Owner sections">
          {shown.map((x) => (
            <button key={x.k} className={current === x.k ? "on" : ""} aria-current={current === x.k ? "page" : undefined} onClick={() => setTab(x.k)}>
              <Icon name={x.icon} size={19} />
              <span>{x.label}</span>
              {!!x.badge && <span className="nav-badge">{x.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="dash-side-foot">
          <a className="side-link" href={href(`/m/${slug}?t=1`)} target="_blank" rel="noreferrer">
            <Icon name="external" size={17} /> Open guest menu
          </a>
          <button className="side-link" onClick={onLogout}>
            <Icon name="logout" size={17} /> Log out
          </button>
          <img src={asset("arki-logo.png")} alt="Arki" className="side-logo" />
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-head">
          <div>
            <p className="dash-kicker">{tenant.name.en}</p>
            <h1>{meta.label}</h1>
          </div>
          <div className="dash-head-actions">
            {current === "qr" && (
              <button className="btn-ghost small" onClick={() => window.print()}>
                <Icon name="printer" size={16} /> Print all
              </button>
            )}
            <a className="btn-ghost small hide-lg" href={href(`/m/${slug}?t=1`)} target="_blank" rel="noreferrer">
              <Icon name="external" size={16} /> Guest menu
            </a>
            <button className="btn-ghost small icon-only hide-lg" onClick={onLogout} aria-label="Log out">
              <Icon name="logout" size={17} />
            </button>
          </div>
        </header>
        <div className="dash-body">
          {current === "orders" && <Orders slug={slug} />}
          {current === "menu" && <MenuEditor slug={slug} />}
          {current === "analytics" && <Analytics slug={slug} />}
          {current === "qr" && <QrCodes slug={slug} />}
          {current === "settings" && <Settings slug={slug} />}
        </div>
        <p className="dash-foot">
          Demo data is stored in this browser. Open the guest menu in another tab to see orders and sold-out changes update live.{" "}
          <button className="link" onClick={() => confirm("Reset all demo data for this restaurant?") && repo.resetDemo(slug)}>
            Reset demo
          </button>{" "}
          · <button className="link" onClick={() => navigate("/")}>All demos</button>
        </p>
      </main>
    </div>
  );
}

function Orders({ slug }: { slug: string }) {
  const s = useTenantState(slug);
  const [, tick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(iv);
  }, []);
  const calls = s.calls.filter((c) => !c.done);
  const fresh = s.orders.filter((o) => o.status === "new");
  const preparing = s.orders.filter((o) => o.status === "preparing");
  const done = s.orders.filter((o) => o.status === "served" || o.status === "cancelled").slice(0, 8);
  const today = s.orders.filter((o) => o.status !== "cancelled" && Date.now() - o.createdAt < 864e5);

  return (
    <div className="orders">
      <div className="stat-strip">
        <Stat icon="inbox" label="New" value={fresh.length} tone="amber" />
        <Stat icon="clock" label="Preparing" value={preparing.length} tone="brand" />
        <Stat icon="bell" label="Calls" value={calls.length} tone={calls.length ? "red" : undefined} />
        <Stat icon="banknote" label="Today" value={birr(today.reduce((a, o) => a + o.total, 0), "en")} />
      </div>

      {calls.length > 0 && (
        <div className="calls" aria-live="polite">
          {calls.map((c) => (
            <div key={c.id} className="call">
              <span className="call-ic" aria-hidden>
                <Icon name={c.reason === "bill" ? "receipt" : "bell"} size={18} />
              </span>
              <div>
                <strong>Table {c.table}</strong>
                <span>
                  {c.reason === "bill" ? "Asks for the bill" : "Is calling a waiter"} · {ago(c.createdAt)}
                </span>
              </div>
              <button className="btn-primary small" onClick={() => repo.resolveCall(slug, c.id)}>
                <Icon name="check" size={16} strokeWidth={2.4} /> Done
              </button>
            </div>
          ))}
        </div>
      )}

      {fresh.length === 0 && preparing.length === 0 && calls.length === 0 ? (
        <div className="empty-card">
          <span className="empty-ic">
            <Icon name="inbox" size={26} />
          </span>
          <div>
            <strong>No open orders yet</strong>
            <p className="muted">
              Open the guest menu for{" "}
              <a href={href(`/m/${slug}?t=5`)} target="_blank" rel="noreferrer">
                table 5
              </a>{" "}
              in another tab and place an order. It appears here instantly.
            </p>
          </div>
        </div>
      ) : (
        <div className="board">
          <OrderColumn slug={slug} title="New" tone="amber" orders={fresh} />
          <OrderColumn slug={slug} title="Preparing" tone="brand" orders={preparing} />
        </div>
      )}

      {done.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">Recent</h2>
          <ul className="recent">
            {done.map((o) => (
              <li key={o.id}>
                <strong>#{o.number}</strong>
                <span className="muted">Table {o.table}</span>
                <span className="muted hide-sm">{ago(o.createdAt)}</span>
                <span className="num">{birr(o.total, "en")}</span>
                <span className={`status-pill st-${o.status}`}>{o.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: IconName; label: string; value: React.ReactNode; tone?: "amber" | "brand" | "red" }) {
  return (
    <div className={`stat ${tone ? `tone-${tone}` : ""}`}>
      <span className="stat-ic" aria-hidden>
        <Icon name={icon} size={18} />
      </span>
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
      </div>
    </div>
  );
}

function OrderColumn({ slug, title, tone, orders }: { slug: string; title: string; tone: "amber" | "brand"; orders: Order[] }) {
  const s = useTenantState(slug);
  const byId = (id: string) => s.items.find((i) => i.id === id);
  const next: Record<OrderStatus, OrderStatus | null> = { new: "preparing", preparing: "served", served: null, cancelled: null };
  const label: Record<OrderStatus, string> = { new: "Start preparing", preparing: "Mark served", served: "", cancelled: "" };
  return (
    <section className={`board-col tone-${tone}`} aria-label={title}>
      <h2>
        <span className="dot" /> {title} <span className="count">{orders.length}</span>
      </h2>
      {orders.length === 0 && <p className="board-empty">Nothing here</p>}
      {orders.map((o) => (
        <article key={o.id} className={`order-card st-${o.status}`}>
          <header>
            <strong className="order-no">#{o.number}</strong>
            <span className="pill">
              <Icon name="table" size={13} /> Table {o.table}
            </span>
            <span className="order-time">
              <Icon name="clock" size={13} /> {ago(o.createdAt)}
            </span>
          </header>
          <ul>
            {o.lines.map((l) => {
              const it = byId(l.itemId);
              const sub = it ? describeChoices(it, l.choices, "en") : "";
              return (
                <li key={l.key}>
                  <span className="q">{l.qty}×</span>
                  <div>
                    <span>{it?.name.en ?? l.itemId}</span>
                    {sub && <small>{sub}</small>}
                    {l.note && <small className="note">“{l.note}”</small>}
                  </div>
                </li>
              );
            })}
          </ul>
          {o.note && (
            <p className="order-note">
              <Icon name="pencil" size={14} /> {o.note}
            </p>
          )}
          <footer>
            <span className="num total">{birr(o.total, "en")}</span>
            <div>
              <button className="btn-ghost small" onClick={() => repo.setOrderStatus(slug, o.id, "cancelled")}>
                Cancel
              </button>
              <button className="btn-primary small" onClick={() => repo.setOrderStatus(slug, o.id, next[o.status]!)}>
                {label[o.status]}
              </button>
            </div>
          </footer>
        </article>
      ))}
    </section>
  );
}

function MenuEditor({ slug }: { slug: string }) {
  const s = useTenantState(slug);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const soldCount = s.items.filter((i) => i.soldOut).length;
  return (
    <div className="menu-editor">
      <div className="toolbar">
        <label className="search compact">
          <Icon name="search" size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" aria-label="Search items" />
        </label>
        <span className="muted toolbar-meta">
          {s.items.length} items · {soldCount} sold out
        </span>
      </div>
      {CATEGORIES.map((c) => {
        const list = s.items.filter((i) => i.categoryId === c.id && (!query || i.name.en.toLowerCase().includes(query) || i.name.am.includes(q.trim())));
        if (!list.length) return null;
        return (
          <section key={c.id} className="panel">
            <h2 className="panel-title">
              <span className="sec-ic" aria-hidden>
                <Icon name={categoryIcon(c.id)} size={17} />
              </span>
              {c.name.en} <small>{list.length}</small>
            </h2>
            <div className="me-list">
              {list.map((i) => (
                <div key={i.id} className={`me-row ${i.soldOut ? "is-sold" : ""} ${i.hidden ? "is-hidden" : ""}`}>
                  <Photo className="me-thumb" src={i.photo} alt="" categoryId={i.categoryId} />
                  <div className="me-name">
                    <strong>
                      {i.name.en} {i.hidden && <span className="status-pill st-hidden">Hidden</span>}
                    </strong>
                    <span className="muted">{i.name.am}</span>
                  </div>
                  <span className="me-price num">{birr(i.price, "en")}</span>
                  <label className="switch">
                    <input type="checkbox" checked={!i.soldOut} onChange={(e) => repo.setSoldOut(slug, i.id, !e.target.checked)} aria-label={`${i.name.en} available`} />
                    <span className="track" />
                    <span className="switch-label">{i.soldOut ? "Sold out" : "Available"}</span>
                  </label>
                  <button className="btn-ghost small icon-only" onClick={() => setEditing(structuredClone(i))} aria-label={`Edit ${i.name.en}`}>
                    <Icon name="pencil" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {editing && <EditItemSheet slug={slug} item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditItemSheet({ slug, item, onClose }: { slug: string; item: MenuItem; onClose: () => void }) {
  const [editing, setEditing] = useState<MenuItem>(item);
  const dialogRef = useDialog<HTMLFormElement>(onClose);
  const tag = (k: "fasting" | "popular", on: boolean) => setEditing({ ...editing, tags: on ? [...editing.tags, k] : editing.tags.filter((x) => x !== k) });
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-item-title"
        className="sheet edit-form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          repo.updateItem(slug, editing);
          onClose();
        }}
      >
        <span className="sheet-grab" aria-hidden />
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
          <Icon name="x" size={18} strokeWidth={2.2} />
        </button>
        <div className="sheet-scroll">
          <div className="sheet-body">
            <header className="sheet-head">
              <p className="sheet-kicker">Edit item</p>
              <h2 className="sheet-title" id="edit-item-title">
                {editing.name.en || "Untitled"}
              </h2>
            </header>
            <div className="row2">
              <label className="field">
                <span className="field-label">Name (English)</span>
                <input value={editing.name.en} onChange={(e) => setEditing({ ...editing, name: { ...editing.name, en: e.target.value } })} required />
              </label>
              <label className="field">
                <span className="field-label">Name (Amharic)</span>
                <input lang="am" value={editing.name.am} onChange={(e) => setEditing({ ...editing, name: { ...editing.name, am: e.target.value } })} />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Description (English)</span>
              <textarea rows={2} value={editing.description.en} onChange={(e) => setEditing({ ...editing, description: { ...editing.description, en: e.target.value } })} />
            </label>
            <label className="field">
              <span className="field-label">Description (Amharic)</span>
              <textarea lang="am" rows={2} value={editing.description.am} onChange={(e) => setEditing({ ...editing, description: { ...editing.description, am: e.target.value } })} />
            </label>
            <div className="row2">
              <label className="field">
                <span className="field-label">Price (ETB)</span>
                <input type="number" inputMode="numeric" min={0} step={5} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} required />
              </label>
              <label className="field">
                <span className="field-label">Category</span>
                <select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.en}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="field-label">Photo URL</span>
              <input type="url" value={editing.photo ?? ""} onChange={(e) => setEditing({ ...editing, photo: e.target.value || undefined })} placeholder="https://…" />
            </label>
            <div className="checks">
              <label className="check">
                <input type="checkbox" checked={editing.tags.includes("fasting")} onChange={(e) => tag("fasting", e.target.checked)} />
                <span>Fasting</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={editing.tags.includes("popular")} onChange={(e) => tag("popular", e.target.checked)} />
                <span>Popular</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={!!editing.hidden} onChange={(e) => setEditing({ ...editing, hidden: e.target.checked })} />
                <span>Hide from menu</span>
              </label>
            </div>
          </div>
        </div>
        <div className="sheet-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary grow" type="submit">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

function Analytics({ slug }: { slug: string }) {
  const s = useTenantState(slug);
  const stats = useMemo(() => {
    const per = new Map<string, { views: number; adds: number; sold: number; revenue: number }>();
    const get = (id: string) => per.get(id) ?? (per.set(id, { views: 0, adds: 0, sold: 0, revenue: 0 }), per.get(id)!);
    for (const e of s.events) {
      if (!e.itemId) continue;
      if (e.kind === "item_view") get(e.itemId).views++;
      if (e.kind === "add_to_cart") get(e.itemId).adds++;
    }
    const valid = s.orders.filter((o) => o.status !== "cancelled");
    for (const o of valid)
      for (const l of o.lines) {
        const g = get(l.itemId);
        g.sold += l.qty;
        g.revenue += l.unitPrice * l.qty;
      }
    const opens = s.events.filter((e) => e.kind === "menu_open").length;
    const upsell = s.events.filter((e) => e.kind === "upsell_added").reduce((a, e) => a + (e.value ?? 0), 0);
    const revenue = valid.reduce((a, o) => a + o.total, 0);
    const rows = [...per.entries()]
      .map(([id, v]) => ({ id, item: s.items.find((i) => i.id === id), ...v }))
      .filter((r) => r.item)
      .sort((a, b) => b.sold - a.sold || b.views - a.views);
    return { opens, orders: valid.length, revenue, upsell, avg: valid.length ? revenue / valid.length : 0, conv: opens ? (valid.length / opens) * 100 : 0, rows };
  }, [s.events, s.orders, s.items]);

  const maxViews = Math.max(1, ...stats.rows.map((r) => r.views));
  const kpis: [IconName, string, string, string][] = [
    ["eye", "Menu opens", String(stats.opens), "Guests who scanned a QR code"],
    ["orders", "Orders", String(stats.orders), "Excluding cancelled"],
    ["banknote", "Revenue", birr(stats.revenue, "en"), "Incl. service and VAT"],
    ["receipt", "Average order", birr(Math.round(stats.avg), "en"), "Per order"],
    ["percent", "Opens → orders", `${stats.conv.toFixed(0)}%`, "Conversion"],
    ["sparkles", "From upselling", birr(stats.upsell, "en"), "“Goes well with” adds"],
  ];
  return (
    <div className="analytics">
      <div className="kpis">
        {kpis.map(([icon, label, value, hint]) => (
          <div key={label} className="kpi">
            <span className="kpi-ic" aria-hidden>
              <Icon name={icon} size={18} />
            </span>
            <span className="kpi-label">{label}</span>
            <strong className="kpi-value num">{value}</strong>
            <span className="kpi-hint">{hint}</span>
          </div>
        ))}
      </div>
      <section className="panel">
        <h2 className="panel-title">Items: views, adds and sales</h2>
        {stats.rows.length === 0 ? (
          <div className="empty-inline">
            <Icon name="chart" size={22} />
            <p className="muted">No activity yet. Browse the guest menu and place an order to see numbers here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="a-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Views</th>
                  <th scope="col" className="r">
                    Added
                  </th>
                  <th scope="col" className="r">
                    Sold
                  </th>
                  <th scope="col" className="r">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.rows.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      <span className="t-item">
                        <Photo className="t-thumb" src={r.item!.photo} alt="" categoryId={r.item!.categoryId} />
                        {r.item!.name.en}
                      </span>
                    </th>
                    <td>
                      <div className="bar">
                        <span style={{ width: `${(r.views / maxViews) * 100}%` }} />
                        <em className="num">{r.views}</em>
                      </div>
                    </td>
                    <td className="r num">{r.adds}</td>
                    <td className="r num">{r.sold}</td>
                    <td className="r num">{birr(r.revenue, "en")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small-note">
          <Icon name="trending" size={15} /> Items with many views but few adds may need a better photo, description or price.
        </p>
      </section>
    </div>
  );
}

function QrCodes({ slug }: { slug: string }) {
  const tenant = getTenant(slug)!;
  const s = useTenantState(slug);
  const [codes, setCodes] = useState<{ table: number; url: string; img: string }[]>([]);
  useEffect(() => {
    const base = window.location.origin + BASE;
    Promise.all(
      Array.from({ length: tenant.tables }, (_, i) => i + 1).map(async (table) => {
        const url = `${base}/m/${slug}?t=${table}`;
        const img = await QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#0E2A1D", light: "#FFFFFF" } });
        return { table, url, img };
      }),
    ).then(setCodes);
  }, [slug, tenant.tables]);
  return (
    <div>
      <p className="lead-note">One QR code per table. The table number comes from the code, so orders go to the right table. Print and place them on each table.</p>
      <div className="qr-grid">
        {codes.map((c) => (
          <a key={c.table} className="qr-card" href={c.url} target="_blank" rel="noreferrer" {...appearanceAttrs(s.appearance)}>
            <span className="qr-name">{tenant.name.en}</span>
            <img src={c.img} alt={`QR code for table ${c.table}`} />
            <strong>Table {c.table}</strong>
            <span className="muted">Scan to see the menu and order</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Settings({ slug }: { slug: string }) {
  const s = useTenantState(slug);
  const tenant = getTenant(slug)!;
  const a = s.appearance;
  const theme = THEMES[a.theme];
  return (
    <div className="settings">
      <section className="panel appearance-locked">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">
              <Icon name="layers" size={18} /> Appearance
            </h2>
            <p className="muted">Your menu's look is set up by Arki when the menu is delivered, so it stays consistent on every phone and printed QR card.</p>
          </div>
          <span className="lock-pill">
            <Icon name="lock" size={14} /> Managed by Arki
          </span>
        </div>
        <div className="appearance-summary">
          <span className="swatches" aria-hidden>
            {theme.swatch.map((c) => (
              <span key={c} style={{ background: c }} />
            ))}
          </span>
          <dl>
            <div>
              <dt>Theme</dt>
              <dd>{theme.name}</dd>
            </div>
            <div>
              <dt>Headings</dt>
              <dd>{HEADINGS[a.headings]}</dd>
            </div>
            <div>
              <dt>Layout</dt>
              <dd>{LAYOUTS[a.layout]}</dd>
            </div>
            <div>
              <dt>Corners</dt>
              <dd>{CORNERS[a.corners]}</dd>
            </div>
          </dl>
        </div>
        <p className="muted small-note">
          {a.appliedAt ? `Applied by ${a.appliedBy ?? "Arki"} on ${fmtDate(a.appliedAt)}.` : "Delivered with the menu."} To change it, contact your Arki account manager.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">
          <Icon name="sliders" size={18} /> Features
        </h2>
        <p className="muted">
          Switch features on or off for this business. Arki sets which features the <b>{tenant.plan}</b> plan includes; changes apply to guests’ phones right away.
        </p>
        <div className="settings-list">
          {(Object.keys(FEATURE_LABELS) as (keyof FeatureFlags)[]).map((k) => (
            <label key={k} className="setting">
              <span className="setting-ic" aria-hidden>
                <Icon name={FEATURE_LABELS[k][2]} size={18} />
              </span>
              <div>
                <strong>{FEATURE_LABELS[k][0]}</strong>
                <span className="muted">{FEATURE_LABELS[k][1]}</span>
              </div>
              <span className="switch">
                <input type="checkbox" checked={s.features[k]} onChange={(e) => repo.setFeature(slug, k, e.target.checked)} />
                <span className="track" />
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">
          <Icon name="sparkles" size={18} /> Coming next on the Arki platform
        </h2>
        <ul className="roadmap">
          <li>
            <Icon name="printer" size={16} /> Kitchen display and printer tickets
          </li>
          <li>
            <Icon name="card" size={16} /> Telebirr and Chapa payments at the table
          </li>
          <li>
            <Icon name="layers" size={16} /> Stock and recipe costing linked to menu items
          </li>
          <li>
            <Icon name="receipt" size={16} /> Ministry of Revenues e-invoicing
          </li>
          <li>
            <Icon name="hotel" size={16} /> Rooms, room service and multi-branch hotels
          </li>
        </ul>
      </section>
    </div>
  );
}
