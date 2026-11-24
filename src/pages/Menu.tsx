import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartSheet from "../components/CartSheet";
import ItemSheet from "../components/ItemSheet";
import Photo from "../components/Photo";
import Tags from "../components/Tags";
import { CATEGORIES } from "../data/seed";
import { birr, t, tx, type UIKey } from "../lib/i18n";
import { totals } from "../lib/pricing";
import { getTenant, repo, useTenantState } from "../lib/store";
import { asset } from "../lib/router";
import type { CartLine, Lang, MenuItem } from "../types";

type FilterKey = "fasting" | "vegetarian" | "noGluten" | "noDairy" | "noNuts" | "noEgg";
const FILTERS: FilterKey[] = ["fasting", "vegetarian", "noGluten", "noDairy", "noNuts", "noEgg"];

function matches(item: MenuItem, f: FilterKey) {
  switch (f) {
    case "fasting":
      return item.tags.includes("fasting") || !!item.fastingOption;
    case "vegetarian":
      return item.tags.includes("vegetarian") || item.tags.includes("fasting");
    case "noGluten":
      return !item.allergens.includes("gluten");
    case "noDairy":
      return !item.allergens.includes("dairy") || !!item.fastingOption;
    case "noNuts":
      return !item.allergens.includes("nuts");
    case "noEgg":
      return !item.allergens.includes("egg");
  }
}

const readJSON = <T,>(k: string, fallback: T): T => {
  try {
    const v = sessionStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (k: string, v: unknown) => {
  try {
    sessionStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

export default function MenuPage({ slug, table }: { slug: string; table: string }) {
  const tenant = getTenant(slug)!;
  const state = useTenantState(slug);
  const f = state.features;

  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("arki-menu:lang") as Lang) || "en";
    } catch {
      return "en";
    }
  });
  const effLang: Lang = f.amharic ? lang : "en";
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("arki-menu:lang", l);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    document.documentElement.lang = effLang;
    document.title = `${tx(effLang, tenant.name)} · Menu`;
  }, [effLang, tenant]);

  const cartKey = `arki-cart:${slug}:${table}`;
  const ordersKey = `arki-myorders:${slug}:${table}`;
  const [cart, setCart] = useState<CartLine[]>(() => readJSON(cartKey, []));
  const [myOrders, setMyOrders] = useState<string[]>(() => readJSON(ordersKey, []));
  useEffect(() => writeJSON(cartKey, cart), [cart, cartKey]);
  useEffect(() => writeJSON(ordersKey, myOrders), [myOrders, ordersKey]);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const [fromUpsell, setFromUpsell] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);

  const canOrder = f.ordering && !!table;

  useEffect(() => {
    const k = `arki-opened:${slug}`;
    if (!sessionStorage.getItem(k)) {
      sessionStorage.setItem(k, "1");
      repo.track(slug, "menu_open");
    }
  }, [slug]);

  // Keep open items in sync with live changes (e.g. the owner marks an item sold out).
  const items = state.items.filter((i) => !i.hidden);
  const liveOpen = openItem ? items.find((i) => i.id === openItem.id) ?? null : null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!q || i.name.en.toLowerCase().includes(q) || i.name.am.includes(q) || i.description.en.toLowerCase().includes(q)) &&
        [...filters].every((fk) => matches(i, fk)),
    );
  }, [items, query, filters]);

  const sections = CATEGORIES.map((c) => ({ c, list: visible.filter((i) => i.categoryId === c.id) })).filter((s) => s.list.length);

  const toggleFilter = (k: FilterKey) => {
    setFilters((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
    repo.track(slug, "filter_used");
  };

  // Scroll spy for the category bar
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActiveCat(vis[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [sections.length, query, filters]);
  useEffect(() => {
    chipRefs.current[activeCat]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeCat]);

  const jump = (id: string) => {
    const el = sectionRefs.current[id];
    const bar = document.querySelector(".sticky-tools")?.getBoundingClientRect().height ?? 140;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar - 8, behavior: "smooth" });
  };

  const open = useCallback(
    (item: MenuItem, upsell = false) => {
      setOpenItem(item);
      setFromUpsell(upsell);
      repo.track(slug, "item_view", item.id);
    },
    [slug],
  );

  const addLine = (line: CartLine) => {
    setCart((c) => {
      const ex = c.find((l) => l.key === line.key);
      return ex ? c.map((l) => (l.key === line.key ? { ...l, qty: l.qty + line.qty } : l)) : [...c, line];
    });
    repo.track(slug, "add_to_cart", line.itemId, line.unitPrice * line.qty);
    if (fromUpsell) repo.track(slug, "upsell_added", line.itemId, line.unitPrice * line.qty);
    setOpenItem(null);
    flash(effLang === "am" ? "ወደ ትዕዛዝ ተጨምሯል" : "Added to your order");
  };

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const setQty = (key: string, qty: number) => setCart((c) => (qty <= 0 ? c.filter((l) => l.key !== key) : c.map((l) => (l.key === key ? { ...l, qty } : l))));

  // Items sold out after being added are dropped before sending.
  const validCart = cart.filter((l) => !items.find((i) => i.id === l.itemId)?.soldOut);
  const tot = totals(validCart, tenant);
  const count = validCart.reduce((s, l) => s + l.qty, 0);

  const place = (note: string) => {
    const o = repo.placeOrder(slug, { table, lines: validCart, note: note || undefined, ...tot, lang: effLang });
    repo.track(slug, "order_placed", undefined, o.total);
    setMyOrders((m) => [o.id, ...m]);
    setCart([]);
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placed = state.orders.filter((o) => myOrders.includes(o.id)).slice(0, 3);
  const activeCall = state.calls.find((c) => c.table === table && !c.done);
  const cat = (id: string) => CATEGORIES.find((c) => c.id === id);

  return (
    <div className="menu-page">
      <header className="m-header">
        <div className="m-brand">
          <div className="m-logo" aria-hidden>
            {tenant.name.en[0]}
          </div>
          <div>
            <h1>{tx(effLang, tenant.name)}</h1>
            <p>{tx(effLang, tenant.tagline)}</p>
            {table && (
              <span className="table-chip">
                {t(effLang, "table")} {table}
              </span>
            )}
          </div>
        </div>
        <div className="m-actions">
          {f.amharic && (
            <div className="lang-switch" role="group" aria-label="Language">
              <button className={effLang === "en" ? "on" : ""} onClick={() => setLang("en")}>
                EN
              </button>
              <button className={effLang === "am" ? "on" : ""} onClick={() => setLang("am")}>
                አማ
              </button>
            </div>
          )}
        </div>
      </header>

      {placed.length > 0 && (
        <section className="order-tracker" aria-live="polite">
          {placed.map((o) => {
            const steps: Array<typeof o.status> = ["new", "preparing", "served"];
            const idx = steps.indexOf(o.status);
            return (
              <div key={o.id} className={`tracker-card status-${o.status}`}>
                <div className="tracker-head">
                  <strong>
                    {t(effLang, "sent")} #{o.number}
                  </strong>
                  <span>{t(effLang, `status_${o.status}` as UIKey)}</span>
                </div>
                {o.status !== "cancelled" && (
                  <div className="tracker-steps">
                    {steps.map((s, i) => (
                      <span key={s} className={i <= idx ? "done" : ""} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      <div className="sticky-tools">
        <div className="search">
          <span aria-hidden>⌕</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(effLang, "search")} aria-label={t(effLang, "search")} />
        </div>
        {f.filters && (
          <div className="chip-row filters" role="group" aria-label={t(effLang, "filters")}>
            {FILTERS.map((k) => (
              <button key={k} className={`chip ${filters.has(k) ? "on" : ""} ${k === "fasting" ? "chip-fasting" : ""}`} onClick={() => toggleFilter(k)} aria-pressed={filters.has(k)}>
                {k === "fasting" && "🌿 "}
                {t(effLang, k)}
              </button>
            ))}
            {filters.size > 0 && (
              <button className="chip clear" onClick={() => setFilters(new Set())}>
                {t(effLang, "clear")}
              </button>
            )}
          </div>
        )}
        <nav className="chip-row cats" aria-label="Categories">
          {sections.map(({ c }) => (
            <button key={c.id} ref={(el) => (chipRefs.current[c.id] = el)} className={`cat-chip ${activeCat === c.id ? "on" : ""}`} onClick={() => jump(c.id)}>
              <span aria-hidden>{c.icon}</span> {tx(effLang, c.name)}
            </button>
          ))}
        </nav>
      </div>

      {!f.ordering && <p className="notice">{t(effLang, "viewOnly")}</p>}
      {f.ordering && !table && <p className="notice">{t(effLang, "noTable")}</p>}

      <main className="m-main">
        {sections.length === 0 && <p className="empty">{t(effLang, "empty")}</p>}
        {sections.map(({ c, list }) => (
          <section key={c.id} id={`cat-${c.id}`} ref={(el) => (sectionRefs.current[c.id] = el)} className="m-section">
            <h2>
              {tx(effLang, c.name)} <small>{list.length}</small>
            </h2>
            <div className="item-grid">
              {list.map((i) => (
                <button key={i.id} className={`item-card ${i.soldOut && f.liveSoldOut ? "sold" : ""}`} onClick={() => open(i)}>
                  <div className="item-text">
                    <h3>{tx(effLang, i.name)}</h3>
                    <p className="item-desc">{tx(effLang, i.description)}</p>
                    <Tags item={i} lang={effLang} />
                    <div className="item-foot">
                      <span className="price">{birr(i.price, effLang)}</span>
                      {i.options.length > 0 && <span className="opt-hint">{effLang === "am" ? "አማራጮች አሉ" : "Options"}</span>}
                    </div>
                  </div>
                  {f.photos && (
                    <div className="item-photo-wrap">
                      <Photo className="item-photo" src={i.photo} alt={tx(effLang, i.name)} icon={c.icon} />
                      {i.soldOut && f.liveSoldOut && <span className="sold-label">{t(effLang, "soldOut")}</span>}
                      {canOrder && !i.soldOut && (
                        <span className="add-dot" aria-hidden>
                          +
                        </span>
                      )}
                    </div>
                  )}
                  {!f.photos && i.soldOut && f.liveSoldOut && <span className="sold-label inline">{t(effLang, "soldOut")}</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
        <footer className="m-footer">
          <p>
            {tenant.address} · {tenant.phone}
          </p>
          <a href="https://arkisolutions.com" target="_blank" rel="noreferrer" className="powered">
            <img src={asset("arki-logo.png")} alt="Arki Tech Solutions" />
            <span>{t(effLang, "poweredBy")}</span>
          </a>
        </footer>
      </main>

      {(count > 0 || (f.callWaiter && table)) && (
        <div className="bottom-bar">
          {f.callWaiter && table && (
            <button
              className={`btn-ghost ${activeCall ? "called" : ""}`}
              onClick={() => {
                if (activeCall) return;
                repo.callWaiter(slug, table, "waiter");
                flash(t(effLang, "called"));
              }}
            >
              {activeCall ? `✓ ${t(effLang, "called")}` : `🔔 ${t(effLang, "callWaiter")}`}
            </button>
          )}
          {canOrder && count > 0 && (
            <button className="btn-primary grow cart-btn" onClick={() => (setToast(""), setCartOpen(true))}>
              <span className="count">{count}</span>
              <span>{t(effLang, "viewOrder")}</span>
              <span>{birr(tot.subtotal, effLang)}</span>
            </button>
          )}
          {canOrder && count === 0 && placed.length > 0 && f.callWaiter && (
            <button className="btn-ghost" onClick={() => !activeCall && (repo.callWaiter(slug, table, "bill"), flash(t(effLang, "called")))}>
              🧾 {t(effLang, "askBill")}
            </button>
          )}
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {liveOpen && (
        <ItemSheet
          item={liveOpen}
          category={cat(liveOpen.categoryId)}
          lang={effLang}
          features={f}
          canOrder={canOrder}
          pairs={liveOpen.pairsWith.map((id) => items.find((i) => i.id === id)).filter((x): x is MenuItem => !!x)}
          onAdd={addLine}
          onOpen={(i) => open(i, true)}
          onClose={() => setOpenItem(null)}
        />
      )}
      {cartOpen && (
        <CartSheet
          lines={validCart}
          items={items}
          tenant={tenant}
          lang={effLang}
          table={table}
          features={f}
          onQty={setQty}
          onOpen={(i) => {
            setCartOpen(false);
            open(i, true);
          }}
          onPlace={place}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
