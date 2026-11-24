import { CATEGORIES } from "../data/seed";
import { useEffect, useState } from "react";
import { birr, t, tx } from "../lib/i18n";
import { describeChoices, totals } from "../lib/pricing";
import type { CartLine, FeatureFlags, Lang, MenuItem, Tenant } from "../types";
import Photo from "./Photo";

interface Props {
  lines: CartLine[];
  items: MenuItem[];
  tenant: Tenant;
  lang: Lang;
  table: string;
  features: FeatureFlags;
  onQty: (key: string, qty: number) => void;
  onOpen: (item: MenuItem) => void;
  onPlace: (note: string) => void;
  onClose: () => void;
}

export default function CartSheet({ lines, items, tenant, lang, table, features, onQty, onOpen, onPlace, onClose }: Props) {
  const [note, setNote] = useState("");
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const byId = (id: string) => items.find((i) => i.id === id)!;
  const tot = totals(lines, tenant);
  const inCart = new Set(lines.map((l) => l.itemId));
  const suggestions = features.upselling
    ? [...new Set(lines.flatMap((l) => byId(l.itemId)?.pairsWith ?? []))]
        .filter((id) => !inCart.has(id))
        .map(byId)
        .filter((i) => i && !i.soldOut && !i.hidden)
        .slice(0, 4)
    : [];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet cart" role="dialog" aria-modal="true" aria-label={t(lang, "yourOrder")} onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="sheet-body">
          <h2 className="sheet-title">{t(lang, "yourOrder")}</h2>
          <p className="meta-line">
            {t(lang, "table")} {table} · {tx(lang, tenant.name)}
          </p>
          <ul className="cart-lines">
            {lines.map((l) => {
              const it = byId(l.itemId);
              return (
                <li key={l.key}>
                  <div className="cart-line-main">
                    <strong>{tx(lang, it.name)}</strong>
                    <span className="cart-sub">{describeChoices(it, l.choices, lang)}</span>
                    {l.note && <span className="cart-sub">“{l.note}”</span>}
                  </div>
                  <div className="cart-line-side">
                    <span className="cart-price">{birr(l.unitPrice * l.qty, lang)}</span>
                    <div className="qty small">
                      <button onClick={() => onQty(l.key, l.qty - 1)} aria-label={l.qty === 1 ? t(lang, "remove") : "−"}>
                        {l.qty === 1 ? "🗑" : "−"}
                      </button>
                      <span>{l.qty}</span>
                      <button onClick={() => onQty(l.key, l.qty + 1)} aria-label="+">
                        +
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {suggestions.length > 0 && (
            <div className="pairs">
              <h3>{t(lang, "pairs")}</h3>
              <div className="pairs-row">
                {suggestions.map((p) => (
                  <button key={p.id} className="pair" onClick={() => onOpen(p)}>
                    {features.photos && <Photo className="pair-photo" src={p.photo} alt="" icon={CATEGORIES.find((c) => c.id === p.categoryId)?.icon ?? "🍽"} />}
                    <span className="pair-name">{tx(lang, p.name)}</span>
                    <span className="pair-price">+ {birr(p.price, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {features.orderNotes && (
            <label className="note-field">
              <span>{t(lang, "orderNote")}</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(lang, "notePh")} maxLength={160} />
            </label>
          )}

          <dl className="totals">
            <div>
              <dt>{t(lang, "subtotal")}</dt>
              <dd>{birr(tot.subtotal, lang)}</dd>
            </div>
            {tenant.serviceChargePct > 0 && (
              <div>
                <dt>
                  {t(lang, "service")} ({tenant.serviceChargePct}%)
                </dt>
                <dd>{birr(tot.service, lang)}</dd>
              </div>
            )}
            <div>
              <dt>
                {t(lang, "vat")} ({tenant.vatPct}%)
              </dt>
              <dd>{birr(tot.vat, lang)}</dd>
            </div>
            <div className="grand">
              <dt>{t(lang, "total")}</dt>
              <dd>{birr(tot.total, lang)}</dd>
            </div>
          </dl>
        </div>
        <div className="sheet-footer">
          <button className="btn-primary grow" disabled={!lines.length} onClick={() => onPlace(note.trim())}>
            {t(lang, "placeOrder")} · {birr(tot.total, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
