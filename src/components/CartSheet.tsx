import { useState } from "react";
import { birr, t, tx } from "../lib/i18n";
import { useDialog } from "../lib/useDialog";
import { describeChoices, totals } from "../lib/pricing";
import type { CartLine, FeatureFlags, Lang, MenuItem, Tenant } from "../types";
import Icon from "./Icon";
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
  const dialogRef = useDialog<HTMLDivElement>(onClose);

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
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} className="sheet cart-sheet" role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={(e) => e.stopPropagation()}>
        <span className="sheet-grab" aria-hidden />
        <button className="sheet-close" onClick={onClose} aria-label={t(lang, "close")}>
          <Icon name="x" size={18} strokeWidth={2.2} />
        </button>
        <div className="sheet-scroll">
          <div className="sheet-body">
            <header className="sheet-head">
              <h2 className="sheet-title" id="cart-title">
                {t(lang, "yourOrder")}
              </h2>
              <p className="cart-meta">
                <span className="pill">
                  <Icon name="table" size={14} /> {t(lang, "table")} {table}
                </span>
                <span className="muted">
                  {count} {t(lang, "items")} · {tx(lang, tenant.name)}
                </span>
              </p>
            </header>

            {lines.length === 0 ? (
              <div className="empty-state">
                <Icon name="bag" size={28} />
                <p>{t(lang, "cartEmpty")}</p>
              </div>
            ) : (
              <ul className="cart-lines">
                {lines.map((l) => {
                  const it = byId(l.itemId);
                  const sub = describeChoices(it, l.choices, lang);
                  return (
                    <li key={l.key}>
                      {features.photos && <Photo className="cart-thumb" src={it.photo} alt="" categoryId={it.categoryId} />}
                      <div className="cart-line-main">
                        <strong>{tx(lang, it.name)}</strong>
                        {sub && <span className="cart-sub">{sub}</span>}
                        {l.note && <span className="cart-sub note-line">“{l.note}”</span>}
                        <span className="cart-price">{birr(l.unitPrice * l.qty, lang)}</span>
                      </div>
                      <div className="qty small" role="group" aria-label={`${t(lang, "qty")}: ${tx(lang, it.name)}`}>
                        <button onClick={() => onQty(l.key, l.qty - 1)} aria-label={l.qty === 1 ? t(lang, "remove") : t(lang, "decrease")} className={l.qty === 1 ? "danger" : ""}>
                          <Icon name={l.qty === 1 ? "trash" : "minus"} size={16} strokeWidth={2.2} />
                        </button>
                        <span>{l.qty}</span>
                        <button onClick={() => onQty(l.key, l.qty + 1)} aria-label={t(lang, "increase")}>
                          <Icon name="plus" size={16} strokeWidth={2.4} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {suggestions.length > 0 && (
              <section className="pairs">
                <h3>{t(lang, "pairs")}</h3>
                <div className="pairs-row">
                  {suggestions.map((p) => (
                    <button key={p.id} className="pair" onClick={() => onOpen(p)}>
                      {features.photos && <Photo className="pair-photo" src={p.photo} alt="" categoryId={p.categoryId} />}
                      <span className="pair-name">{tx(lang, p.name)}</span>
                      <span className="pair-price">
                        <Icon name="plus" size={12} strokeWidth={2.6} /> {birr(p.price, lang)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {features.orderNotes && (
              <label className="field">
                <span className="field-label">{t(lang, "orderNote")}</span>
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
        </div>
        <div className="sheet-footer">
          <button className="btn-primary grow add-btn" disabled={!lines.length} onClick={() => onPlace(note.trim())}>
            <span>{t(lang, "placeOrder")}</span>
            <span className="add-price">{birr(tot.total, lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
