import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { CATEGORIES } from "../data/seed";
import { birr } from "../lib/i18n";
import { describeChoices } from "../lib/pricing";
import { asset, BASE, href, navigate } from "../lib/router";
import { getTenant, repo, useTenantState } from "../lib/store";
import type { FeatureFlags, MenuItem, OrderStatus } from "../types";

type Tab = "orders" | "menu" | "analytics" | "qr" | "settings";

const FEATURE_LABELS: Record<keyof FeatureFlags, [string, string]> = {
  ordering: ["QR table ordering", "Guests order and send to the kitchen from their table."],
  amharic: ["Amharic menu", "Language switch between Amharic and English."],
  photos: ["Item photos", "Show a photo for each item."],
  filters: ["Fasting & dietary filters", "Fasting, vegetarian and allergen filters."],
  upselling: ["Upselling", "“Goes well with” suggestions on items and in the cart."],
  liveSoldOut: ["Live sold-out", "Sold-out items update on guests’ phones instantly."],
  callWaiter: ["Call waiter / bill", "Guests can call a waiter or ask for the bill."],
  analytics: ["Menu analytics", "Track views, add-to-cart and orders per item."],
  orderNotes: ["Order notes", "Guests can add notes like “no onion”."],
};

const ago = (ts: number) => {
  const m = Math.round((Date.now() - ts) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

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
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim().toLowerCase() === tenant.owner.email && pw === tenant.owner.password) onOk();
          else setErr("Wrong email or password.");
        }}
      >
        <img src={asset("arki-logo.png")} alt="Arki Tech Solutions" className="login-logo" />
        <h1>Owner login</h1>
        <p className="muted">{tenant.name.en}</p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />
        </label>
        {err && <p className="error">{err}</p>}
        <button className="btn-primary" type="submit">
          Log in
        </button>
        <p className="demo-hint">
          Demo login: <code>{tenant.owner.email}</code> / <code>{tenant.owner.password}</code>
        </p>
      </form>
    </div>
  );
}

function Dashboard({ slug, onLogout }: { slug: string; onLogout: () => void }) {
  const tenant = getTenant(slug)!;
  const s = useTenantState(slug);
  const [tab, setTab] = useState<Tab>("orders");
  const openOrders = s.orders.filter((o) => o.status === "new" || o.status === "preparing").length;
  const openCalls = s.calls.filter((c) => !c.done);

  const tabs: [Tab, string, boolean][] = [
    ["orders", `Live orders${openOrders + openCalls.length ? ` (${openOrders + openCalls.length})` : ""}`, s.features.ordering || s.features.callWaiter],
    ["menu", "Menu", true],
    ["analytics", "Analytics", s.features.analytics],
    ["qr", "QR codes", true],
    ["settings", "Settings", true],
  ];
  const shown = tabs.filter((x) => x[2]);
  const current = shown.some((x) => x[0] === tab) ? tab : "menu";

  return (
    <div className="owner">
      <header className="o-header">
        <div className="o-brand">
          <img src={asset("arki-logo.png")} alt="Arki" />
          <div>
            <strong>{tenant.name.en}</strong>
            <span className="muted">
              Owner panel · {tenant.plan} plan
            </span>
          </div>
        </div>
        <div className="o-head-actions">
          <a className="btn-ghost small" href={href(`/m/${slug}?t=1`)} target="_blank" rel="noreferrer">
            Open guest menu ↗
          </a>
          <button className="btn-ghost small" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>
      <nav className="o-tabs">
        {shown.map(([k, label]) => (
          <button key={k} className={current === k ? "on" : ""} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </nav>
      <main className="o-main">
        {current === "orders" && <Orders slug={slug} />}
        {current === "menu" && <MenuEditor slug={slug} />}
        {current === "analytics" && <Analytics slug={slug} />}
        {current === "qr" && <QrCodes slug={slug} />}
        {current === "settings" && <Settings slug={slug} />}
      </main>
      <p className="o-foot muted">
        Demo data is stored in this browser. Open the guest menu in another tab to see orders and sold-out changes update live.{" "}
        <button className="link" onClick={() => confirm("Reset all demo data for this restaurant?") && repo.resetDemo(slug)}>
          Reset demo
        </button>{" "}
        · <button className="link" onClick={() => navigate("/")}>All demos</button>
      </p>
    </div>
  );
}

function Orders({ slug }: { slug: string }) {
  const s = useTenantState(slug);
  const byId = (id: string) => s.items.find((i) => i.id === id);
  const [, tick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(iv);
  }, []);
  const next: Record<OrderStatus, OrderStatus | null> = { new: "preparing", preparing: "served", served: null, cancelled: null };
  const label: Record<OrderStatus, string> = { new: "Start preparing", preparing: "Mark served", served: "", cancelled: "" };
  const calls = s.calls.filter((c) => !c.done);
  const active = s.orders.filter((o) => o.status === "new" || o.status === "preparing");
  const done = s.orders.filter((o) => o.status === "served" || o.status === "cancelled").slice(0, 8);

  return (
    <div className="orders">
      {calls.length > 0 && (
        <div className="calls">
          {calls.map((c) => (
            <div key={c.id} className="call">
              <span>
                🔔 Table {c.table} {c.reason === "bill" ? "asks for the bill" : "is calling a waiter"} · {ago(c.createdAt)}
              </span>
              <button className="btn-primary small" onClick={() => repo.resolveCall(slug, c.id)}>
                Done
              </button>
            </div>
          ))}
        </div>
      )}
      {active.length === 0 && calls.length === 0 && (
        <div className="empty-card">
          <p>No open orders yet.</p>
          <p className="muted">
            Open the guest menu for <a href={href(`/m/${slug}?t=5`)} target="_blank" rel="noreferrer">table 5</a> in another tab and place an order. It appears here instantly.
          </p>
        </div>
      )}
      <div className="order-grid">
        {active.map((o) => (
          <article key={o.id} className={`order-card st-${o.status}`}>
            <header>
              <strong>#{o.number}</strong>
              <span className="table-chip">Table {o.table}</span>
              <span className="muted">{ago(o.createdAt)}</span>
            </header>
            <ul>
              {o.lines.map((l) => {
                const it = byId(l.itemId);
                return (
                  <li key={l.key}>
                    <b>{l.qty}×</b> {it?.name.en ?? l.itemId}
                    {it && <small>{describeChoices(it, l.choices, "en")}</small>}
                    {l.note && <small className="note">“{l.note}”</small>}
                  </li>
                );
              })}
            </ul>
            {o.note && <p className="note">Note: “{o.note}”</p>}
            <footer>
              <span>{birr(o.total, "en")}</span>
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
      </div>
      {done.length > 0 && (
        <>
          <h3 className="o-h3">Recent</h3>
          <ul className="recent">
            {done.map((o) => (
              <li key={o.id}>
                #{o.number} · Table {o.table} · {birr(o.total, "en")} · <span className={`st st-${o.status}`}>{o.status}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function MenuEditor({ slug }: { slug: string }) {
  const s = useTenantState(slug);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  return (
    <div className="menu-editor">
      {CATEGORIES.map((c) => {
        const list = s.items.filter((i) => i.categoryId === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id}>
            <h3 className="o-h3">
              {c.icon} {c.name.en}
            </h3>
            <div className="me-list">
              {list.map((i) => (
                <div key={i.id} className={`me-row ${i.soldOut ? "is-sold" : ""} ${i.hidden ? "is-hidden" : ""}`}>
                  <div className="me-name">
                    <strong>{i.name.en}</strong>
                    <span className="muted">{i.name.am}</span>
                  </div>
                  <span className="me-price">{birr(i.price, "en")}</span>
                  <label className="switch" title="Sold out">
                    <input type="checkbox" checked={i.soldOut} onChange={(e) => repo.setSoldOut(slug, i.id, e.target.checked)} />
                    <span className="track" />
                    <span className="switch-label">{i.soldOut ? "Sold out" : "Available"}</span>
                  </label>
                  <button className="btn-ghost small" onClick={() => setEditing(structuredClone(i))}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {editing && (
        <div className="sheet-backdrop" onClick={() => setEditing(null)}>
          <form
            className="sheet edit-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              repo.updateItem(slug, editing);
              setEditing(null);
            }}
          >
            <div className="sheet-body">
              <h2 className="sheet-title">Edit item</h2>
              <label>
                Name (English)
                <input value={editing.name.en} onChange={(e) => setEditing({ ...editing, name: { ...editing.name, en: e.target.value } })} required />
              </label>
              <label>
                Name (Amharic)
                <input value={editing.name.am} onChange={(e) => setEditing({ ...editing, name: { ...editing.name, am: e.target.value } })} />
              </label>
              <label>
                Description (English)
                <textarea rows={2} value={editing.description.en} onChange={(e) => setEditing({ ...editing, description: { ...editing.description, en: e.target.value } })} />
              </label>
              <label>
                Description (Amharic)
                <textarea rows={2} value={editing.description.am} onChange={(e) => setEditing({ ...editing, description: { ...editing.description, am: e.target.value } })} />
              </label>
              <div className="row2">
                <label>
                  Price (ETB)
                  <input type="number" min={0} step={5} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} required />
                </label>
                <label>
                  Category
                  <select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.en}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Photo URL
                <input value={editing.photo ?? ""} onChange={(e) => setEditing({ ...editing, photo: e.target.value || undefined })} />
              </label>
              <div className="checks">
                <label>
                  <input type="checkbox" checked={editing.tags.includes("fasting")} onChange={(e) => setEditing({ ...editing, tags: e.target.checked ? [...editing.tags, "fasting"] : editing.tags.filter((x) => x !== "fasting") })} />{" "}
                  Fasting
                </label>
                <label>
                  <input type="checkbox" checked={editing.tags.includes("popular")} onChange={(e) => setEditing({ ...editing, tags: e.target.checked ? [...editing.tags, "popular"] : editing.tags.filter((x) => x !== "popular") })} />{" "}
                  Popular
                </label>
                <label>
                  <input type="checkbox" checked={!!editing.hidden} onChange={(e) => setEditing({ ...editing, hidden: e.target.checked })} /> Hide from menu
                </label>
              </div>
            </div>
            <div className="sheet-footer">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn-primary grow" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
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
    for (const o of valid) for (const l of o.lines) {
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
  return (
    <div className="analytics">
      <div className="kpis">
        <div className="kpi">
          <span>Menu opens</span>
          <strong>{stats.opens}</strong>
        </div>
        <div className="kpi">
          <span>Orders</span>
          <strong>{stats.orders}</strong>
        </div>
        <div className="kpi">
          <span>Revenue</span>
          <strong>{birr(stats.revenue, "en")}</strong>
        </div>
        <div className="kpi">
          <span>Average order</span>
          <strong>{birr(Math.round(stats.avg), "en")}</strong>
        </div>
        <div className="kpi">
          <span>Opens → orders</span>
          <strong>{stats.conv.toFixed(0)}%</strong>
        </div>
        <div className="kpi">
          <span>Added by upselling</span>
          <strong>{birr(stats.upsell, "en")}</strong>
        </div>
      </div>
      <h3 className="o-h3">Items: views, adds and sales</h3>
      {stats.rows.length === 0 ? (
        <p className="muted">No activity yet. Browse the guest menu and place an order to see numbers here.</p>
      ) : (
        <table className="a-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Views</th>
              <th>Added</th>
              <th>Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.item!.name.en}</td>
                <td>
                  <div className="bar">
                    <span style={{ width: `${(r.views / maxViews) * 100}%` }} />
                    <em>{r.views}</em>
                  </div>
                </td>
                <td>{r.adds}</td>
                <td>{r.sold}</td>
                <td>{birr(r.revenue, "en")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small-note">Items with many views but few adds may need a better photo, description or price.</p>
    </div>
  );
}

function QrCodes({ slug }: { slug: string }) {
  const tenant = getTenant(slug)!;
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
      <p className="muted">One QR code per table. The table number comes from the code, so orders go to the right table. Print and place them on each table.</p>
      <button className="btn-ghost small" onClick={() => window.print()}>
        Print all
      </button>
      <div className="qr-grid">
        {codes.map((c) => (
          <a key={c.table} className="qr-card" href={c.url} target="_blank" rel="noreferrer">
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
  return (
    <div className="settings">
      <p className="muted">
        Every feature can be switched on or off for this business. Arki sets which features the <b>{tenant.plan}</b> plan includes; changes apply to guests’ phones right away.
      </p>
      <div className="settings-list">
        {(Object.keys(FEATURE_LABELS) as (keyof FeatureFlags)[]).map((k) => (
          <label key={k} className="setting">
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
      <h3 className="o-h3">Coming in the next layers of the Arki hospitality platform</h3>
      <ul className="roadmap">
        <li>Kitchen display and printer tickets</li>
        <li>Telebirr and Chapa payments at the table</li>
        <li>Stock and recipe costing linked to menu items</li>
        <li>Ministry of Revenues e-invoicing</li>
        <li>Rooms, room service and multi-branch hotels</li>
      </ul>
    </div>
  );
}
