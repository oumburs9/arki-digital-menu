import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartSheet from "../components/CartSheet";
import ItemSheet from "../components/ItemSheet";
import Photo from "../components/Photo";
import Tags from "../components/Tags";
import Icon, { categoryIcon } from "../components/Icon";
import { CATEGORIES } from "../data/seed";
import { birr, t, tx, type UIKey } from "../lib/i18n";
import { totals } from "../lib/pricing";
import { getTenant, repo, useTenantState } from "../lib/store";
import { asset } from "../lib/router";
import { decodeAppearance, useDocumentAppearance } from "../lib/appearance";
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
  // The Arki console previews a draft appearance in an iframe: ?preview=theme.headings.layout.corners
  const preview = useMemo(() => decodeAppearance(new URLSearchParams(window.location.search).get("preview")), []);
  useDocumentAppearance(preview ?? state.appearance);
  const track: typeof repo.track = (...a) => {
    if (!preview) repo.track(...a);
  };

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
      track(slug, "menu_open");
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
    track(slug, "filter_used");
  };

  // Height of the sticky search/filter bar, shared with CSS (scroll offsets) and the scroll spy.
  const toolsRef = useRef<HTMLDivElement>(null);
  const [toolsH, setToolsH] = useState(140);
  useEffect(() => {
    const el = toolsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const h = Math.round(el.getBoundingClientRect().height);
      setToolsH(h);
      document.documentElement.style.setProperty("--tools-h", `${h}px`);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--tools-h");
    };
  }, []);

  // Scroll spy for the category bar
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActiveCat(vis[0].target.id.replace("cat-", ""));
      },
      { rootMargin: `-${toolsH + 8}px 0px -60% 0px` },
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [sections.length, query, filters, toolsH]);
  useEffect(() => {
    chipRefs.current[activeCat]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeCat]);

  const jump = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - toolsH - 8, behavior: "smooth" });
  };

  const open = useCallback(
    (item: MenuItem, upsell = false) => {
      setOpenItem(item);
      setFromUpsell(upsell);
      track(slug, "item_view", item.id);
    },
    [slug],
  );

  const addLine = (line: CartLine) => {
    setCart((c) => {
      const ex = c.find((l) => l.key === line.key);
      return ex ? c.map((l) => (l.key === line.key ? { ...l, qty: l.qty + line.qty } : l)) : [...c, line];
    });
    track(slug, "add_to_cart", line.itemId, line.unitPrice * line.qty);
    if (fromUpsell) track(slug, "upsell_added", line.itemId, line.unitPrice * line.qty);
    setOpenItem(null);
    flash(t(effLang, "added"));
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
    if (preview) return setCartOpen(false); // Arki console preview: never send real orders
    const o = repo.placeOrder(slug, { table, lines: validCart, note: note || undefined, ...tot, lang: effLang });
    track(slug, "order_placed", undefined, o.total);
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
      <header className="m-hero">
        <div className="m-hero-top">
          <div className="m-logo" aria-hidden>
            {tenant.name.en[0]}
          </div>
          {f.amharic && (
            <div className="lang-switch" role="group" aria-label={t(effLang, "language")}>
              <button className={effLang === "en" ? "on" : ""} aria-pressed={effLang === "en"} onClick={() => setLang("en")}>
                EN
              </button>
              <button className={effLang === "am" ? "on" : ""} aria-pressed={effLang === "am"} onClick={() => setLang("am")} lang="am">
                አማ
              </button>
            </div>
          )}
        </div>
        <h1 className="m-title">{tx(effLang, tenant.name)}</h1>
        <p className="m-tagline">{tx(effLang, tenant.tagline)}</p>
        <div className="m-meta">
          {table && (
            <span className="pill pill-brand">
              <Icon name="table" size={14} /> {t(effLang, "table")} {table}
            </span>
          )}
          <span className="pill">
            <Icon name="pin" size={14} /> {tenant.address}
          </span>
        </div>
      </header>

      {placed.length > 0 && (
        <section className="order-tracker" aria-live="polite" aria-label={t(effLang, "orderStatus")}>
          {placed.map((o) => {
            const steps = ["new", "preparing", "served"] as const;
            const idx = steps.indexOf(o.status as (typeof steps)[number]);
            return (
              <div key={o.id} className={`tracker-card status-${o.status}`}>
                <div className="tracker-head">
                  <span className="tracker-ic" aria-hidden>
                    <Icon name={o.status === "served" ? "check" : o.status === "cancelled" ? "x" : "clock"} size={18} strokeWidth={2.2} />
                  </span>
                  <div>
                    <strong>
                      {t(effLang, "sent")} #{o.number}
                    </strong>
                    <span>{t(effLang, `status_${o.status}` as UIKey)}</span>
                  </div>
                </div>
                {o.status !== "cancelled" && (
                  <ol className="tracker-steps">
                    {steps.map((s, i) => (
                      <li key={s} className={i < idx ? "done" : i === idx ? "current" : ""}>
                        <span className="bar" />
                        <span className="lbl">{t(effLang, `step_${s}` as UIKey)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </section>
      )}

      <div className="sticky-tools" ref={toolsRef}>
        <label className="search">
          <Icon name="search" size={19} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(effLang, "search")} aria-label={t(effLang, "search")} />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label={t(effLang, "clear")}>
              <Icon name="x" size={16} strokeWidth={2.2} />
            </button>
          )}
        </label>
        {f.filters && (
          <div className="chip-row filters" role="group" aria-label={t(effLang, "filters")}>
            <span className="chip-lead" aria-hidden>
              <Icon name="sliders" size={16} />
            </span>
            {FILTERS.map((k) => (
              <button key={k} className={`chip ${filters.has(k) ? "on" : ""} ${k === "fasting" ? "chip-fasting" : ""}`} onClick={() => toggleFilter(k)} aria-pressed={filters.has(k)}>
                {k === "fasting" && <Icon name="leaf" size={14} strokeWidth={2.2} />}
                {filters.has(k) && k !== "fasting" && <Icon name="check" size={14} strokeWidth={2.6} />}
                {t(effLang, k)}
              </button>
            ))}
            {filters.size > 0 && (
              <button className="chip clear" onClick={() => setFilters(new Set())}>
                <Icon name="x" size={14} strokeWidth={2.4} /> {t(effLang, "clear")}
              </button>
            )}
          </div>
        )}
        <nav className="cat-row" aria-label={t(effLang, "categories")}>
          {sections.map(({ c }) => (
            <button
              key={c.id}
              ref={(el) => (chipRefs.current[c.id] = el)}
              className={`cat-chip ${activeCat === c.id ? "on" : ""}`}
              aria-current={activeCat === c.id ? "true" : undefined}
              onClick={() => jump(c.id)}
            >
              <Icon name={categoryIcon(c.id)} size={16} /> {tx(effLang, c.name)}
            </button>
          ))}
        </nav>
      </div>

      {!f.ordering && (
        <p className="notice">
          <Icon name="utensils" size={18} /> {t(effLang, "viewOnly")}
        </p>
      )}
      {f.ordering && !table && (
        <p className="notice">
          <Icon name="qr" size={18} /> {t(effLang, "noTable")}
        </p>
      )}

      <main className="m-main">
        {sections.length === 0 && (
          <div className="empty-state">
            <Icon name="search" size={28} />
            <p>{t(effLang, "empty")}</p>
            {(filters.size > 0 || query) && (
              <button className="btn-ghost small" onClick={() => (setFilters(new Set()), setQuery(""))}>
                {t(effLang, "clear")}
              </button>
            )}
          </div>
        )}
        {sections.map(({ c, list }) => (
          <section key={c.id} id={`cat-${c.id}`} ref={(el) => (sectionRefs.current[c.id] = el)} className="m-section" aria-labelledby={`h-${c.id}`}>
            <h2 id={`h-${c.id}`}>
              <span className="sec-ic" aria-hidden>
                <Icon name={categoryIcon(c.id)} size={18} />
              </span>
              {tx(effLang, c.name)} <small>{list.length}</small>
            </h2>
            <div className="item-grid">
              {list.map((i) => {
                const sold = i.soldOut && f.liveSoldOut;
                return (
                  <button key={i.id} className={`item-card ${sold ? "sold" : ""} ${f.photos ? "" : "no-photo"}`} onClick={() => open(i)}>
                    <div className="item-text">
                      <h3>{tx(effLang, i.name)}</h3>
                      <p className="item-desc">{tx(effLang, i.description)}</p>
                      <Tags item={i} lang={effLang} />
                      <div className="item-foot">
                        <span className="price">{birr(i.price, effLang)}</span>
                        {i.options.length > 0 && <span className="opt-hint">{t(effLang, "options")}</span>}
                        {!f.photos && sold && <span className="sold-label inline">{t(effLang, "soldOut")}</span>}
                        {!f.photos && canOrder && !i.soldOut && (
                          <span className="add-dot inline" aria-hidden>
                            <Icon name="plus" size={18} strokeWidth={2.6} />
                          </span>
                        )}
                      </div>
                    </div>
                    {f.photos && (
                      <div className="item-photo-wrap">
                        <Photo className="item-photo" src={i.photo} alt={tx(effLang, i.name)} categoryId={c.id} />
                        {sold && <span className="sold-label">{t(effLang, "soldOut")}</span>}
                        {canOrder && !i.soldOut && (
                          <span className="add-dot" aria-hidden>
                            <Icon name="plus" size={18} strokeWidth={2.6} />
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        <footer className="m-footer">
          <p className="m-contact">
            <span>
              <Icon name="pin" size={15} /> {tenant.address}
            </span>
            <a href={`tel:${tenant.phone.replace(/\s/g, "")}`}>
              <Icon name="phone" size={15} /> {tenant.phone}
            </a>
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
              className={`btn-ghost call-btn ${activeCall ? "called" : ""}`}
              aria-label={activeCall ? t(effLang, "called") : t(effLang, "callWaiter")}
              onClick={() => {
                if (activeCall) return;
                !preview && repo.callWaiter(slug, table, "waiter");
                flash(t(effLang, "called"));
              }}
            >
              <Icon name={activeCall ? "check" : "bell"} size={19} />
              <span className="call-label" aria-hidden>
                {activeCall ? t(effLang, "called") : t(effLang, "callWaiter")}
              </span>
            </button>
          )}
          {canOrder && count > 0 && (
            <button className="btn-primary grow cart-btn" onClick={() => (setToast(""), setCartOpen(true))}>
              <span className="count" aria-label={`${count} ${t(effLang, "items")}`}>
                {count}
              </span>
              <span className="cart-label">{t(effLang, "viewOrder")}</span>
              <span className="cart-total">{birr(tot.subtotal, effLang)}</span>
            </button>
          )}
          {canOrder && count === 0 && placed.length > 0 && f.callWaiter && (
            <button className="btn-ghost bill-btn" onClick={() => !activeCall && (!preview && repo.callWaiter(slug, table, "bill"), flash(t(effLang, "called")))}>
              <Icon name="receipt" size={18} /> {t(effLang, "askBill")}
            </button>
          )}
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={16} strokeWidth={2.6} /> {toast}
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
