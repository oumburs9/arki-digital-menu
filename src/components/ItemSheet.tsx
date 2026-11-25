import { useEffect, useMemo, useState } from "react";
import { birr, t, tx, type UIKey } from "../lib/i18n";
import { useDialog } from "../lib/useDialog";
import { defaultChoices, isFastingChoice, lineKey, unitPrice } from "../lib/pricing";
import type { CartLine, Category, FeatureFlags, Lang, MenuItem } from "../types";
import Icon from "./Icon";
import Photo from "./Photo";
import Tags from "./Tags";

interface Props {
  item: MenuItem;
  category?: Category;
  lang: Lang;
  features: FeatureFlags;
  canOrder: boolean;
  pairs: MenuItem[];
  onAdd: (line: CartLine) => void;
  onOpen: (item: MenuItem) => void;
  onClose: () => void;
}

export default function ItemSheet({ item, category, lang, features, canOrder, pairs, onAdd, onOpen, onClose }: Props) {
  const [choices, setChoices] = useState(() => defaultChoices(item));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const dialogRef = useDialog<HTMLDivElement>(onClose);

  // Opening a "goes well with" item reuses this sheet: reset choices and scroll to the top.
  useEffect(() => {
    setChoices(defaultChoices(item));
    setQty(1);
    setNote("");
    dialogRef.current?.querySelector(".sheet-scroll")?.scrollTo({ top: 0 });
  }, [item.id]);

  const price = useMemo(() => unitPrice(item, choices), [item, choices]);
  const fasting = isFastingChoice(item, choices);
  const hasPhoto = features.photos;

  const toggle = (groupId: string, id: string, single: boolean, max?: number) =>
    setChoices((c) => {
      const cur = c[groupId] ?? [];
      if (single) return { ...c, [groupId]: [id] };
      if (cur.includes(id)) return { ...c, [groupId]: cur.filter((x) => x !== id) };
      if (max && cur.length >= max) return c;
      return { ...c, [groupId]: [...cur, id] };
    });

  const add = () => {
    const n = features.orderNotes ? note.trim() || undefined : undefined;
    onAdd({ key: lineKey(item.id, choices, n), itemId: item.id, qty, choices, note: n, unitPrice: price });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`sheet item-sheet ${hasPhoto ? "has-photo" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet-grab" aria-hidden />
        <button className="sheet-close" onClick={onClose} aria-label={t(lang, "close")}>
          <Icon name="x" size={18} strokeWidth={2.2} />
        </button>
        <div className="sheet-scroll">
          {hasPhoto && (
            <div className="sheet-media">
              <Photo className="sheet-photo" src={item.photo} alt={tx(lang, item.name)} categoryId={category?.id} />
            </div>
          )}
          <div className="sheet-body">
            <header className="sheet-head">
              {category && (
                <p className="sheet-kicker">
                  {tx(lang, category.name)}
                </p>
              )}
              <h2 className="sheet-title" id="item-sheet-title">
                {tx(lang, item.name)}
              </h2>
              {features.amharic && <p className="sheet-alt">{lang === "en" ? item.name.am : item.name.en}</p>}
              <p className="sheet-price">{birr(item.price, lang)}</p>
            </header>
            <Tags item={item} lang={lang} />
            <p className="sheet-desc">{tx(lang, item.description)}</p>
            {(item.prepMinutes || item.allergens.length > 0) && (
              <div className="meta-row">
                {item.prepMinutes && (
                  <span className="meta-pill">
                    <Icon name="clock" size={15} /> ~{item.prepMinutes} {t(lang, "min")}
                  </span>
                )}
                {item.allergens.length > 0 && (
                  <span className="meta-pill warn">
                    <Icon name="alert" size={15} /> {t(lang, "contains")}: {item.allergens.map((a) => t(lang, `allergen_${a}` as UIKey)).join(", ")}
                  </span>
                )}
              </div>
            )}

            {item.soldOut ? (
              <div className="soldout-banner">
                <strong>{t(lang, "soldOut")}</strong>
                <span>{t(lang, "backSoon")}</span>
              </div>
            ) : (
              <>
                {item.options.map((g) => {
                  const picked = choices[g.id] ?? [];
                  return (
                    <fieldset key={g.id} className="opt-group">
                      <legend>
                        <span>{tx(lang, g.name)}</span>
                        <small className={g.required ? "req" : ""}>
                          {g.required ? t(lang, "required") : g.max ? `${t(lang, "chooseUpTo")} ${g.max}` : t(lang, "optional")}
                        </small>
                      </legend>
                      <div className="opt-list">
                        {g.choices.map((c) => {
                          const on = picked.includes(c.id);
                          const limit = g.type === "multi" && !!g.max && picked.length >= g.max && !on;
                          return (
                            <label key={c.id} className={`opt ${on ? "on" : ""} ${limit ? "limit" : ""} ${g.type}`}>
                              <input
                                type={g.type === "single" ? "radio" : "checkbox"}
                                name={`${item.id}-${g.id}`}
                                checked={on}
                                disabled={limit}
                                onChange={() => toggle(g.id, c.id, g.type === "single", g.max)}
                              />
                              <span className="opt-mark" aria-hidden>
                                {on && <Icon name="check" size={13} strokeWidth={3} />}
                              </span>
                              <span className="opt-name">
                                {tx(lang, c.name)}
                                {c.makesFasting && <Icon name="leaf" size={14} className="opt-leaf" />}
                              </span>
                              {c.priceDelta > 0 && <span className="opt-price">+{birr(c.priceDelta, lang)}</span>}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}

                {canOrder && features.orderNotes && (
                  <label className="field">
                    <span className="field-label">{t(lang, "note")}</span>
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(lang, "notePh")} maxLength={120} />
                  </label>
                )}
                {fasting && (
                  <p className="fasting-ok">
                    <Icon name="leaf" size={16} /> {t(lang, "fastingChoice")}
                  </p>
                )}
              </>
            )}

            {features.upselling && pairs.length > 0 && (
              <section className="pairs">
                <h3>{t(lang, "pairs")}</h3>
                <div className="pairs-row">
                  {pairs.map((p) => (
                    <button key={p.id} className="pair" onClick={() => onOpen(p)} disabled={p.soldOut}>
                      {features.photos && <Photo className="pair-photo" src={p.photo} alt="" categoryId={p.categoryId} />}
                      <span className="pair-name">{tx(lang, p.name)}</span>
                      <span className="pair-price">{p.soldOut ? t(lang, "soldOut") : birr(p.price, lang)}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {!item.soldOut && canOrder && (
          <div className="sheet-footer">
            <div className="qty" role="group" aria-label={t(lang, "qty")}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t(lang, "decrease")} disabled={qty <= 1}>
                <Icon name="minus" size={18} strokeWidth={2.4} />
              </button>
              <span aria-live="polite">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label={t(lang, "increase")} disabled={qty >= 20}>
                <Icon name="plus" size={18} strokeWidth={2.4} />
              </button>
            </div>
            <button className="btn-primary grow add-btn" onClick={add}>
              <span>{t(lang, "add")}</span>
              <span className="add-price">{birr(price * qty, lang)}</span>
            </button>
          </div>
        )}
        {!item.soldOut && !canOrder && (
          <div className="sheet-footer view-only-foot">
            <span className="muted">{t(lang, "viewOnlyShort")}</span>
            <strong className="view-only">{birr(price, lang)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
