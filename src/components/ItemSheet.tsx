import { CATEGORIES } from "../data/seed";
import { useEffect, useMemo, useState } from "react";
import { birr, t, tx } from "../lib/i18n";
import { defaultChoices, isFastingChoice, lineKey, unitPrice } from "../lib/pricing";
import type { CartLine, Category, FeatureFlags, Lang, MenuItem } from "../types";
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

  useEffect(() => {
    setChoices(defaultChoices(item));
    setQty(1);
    setNote("");
  }, [item.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const price = useMemo(() => unitPrice(item, choices), [item, choices]);
  const fasting = isFastingChoice(item, choices);

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
      <div className="sheet" role="dialog" aria-modal="true" aria-label={tx(lang, item.name)} onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        {features.photos && <Photo className="sheet-photo" src={item.photo} alt={tx(lang, item.name)} icon={category?.icon ?? "🍽"} />}
        <div className="sheet-body">
          <h2 className="sheet-title">{tx(lang, item.name)}</h2>
          {features.amharic && <p className="sheet-alt">{lang === "en" ? item.name.am : item.name.en}</p>}
          <Tags item={item} lang={lang} />
          <p className="sheet-desc">{tx(lang, item.description)}</p>
          {item.prepMinutes && (
            <p className="meta-line">
              ⏱ ~{item.prepMinutes} {t(lang, "min")}
              {item.allergens.length > 0 && <> · ⚠ {item.allergens.join(", ")}</>}
            </p>
          )}

          {item.soldOut ? (
            <div className="soldout-banner">
              {t(lang, "soldOut")} · {t(lang, "backSoon")}
            </div>
          ) : (
            <>
              {item.options.map((g) => (
                <fieldset key={g.id} className="opt-group">
                  <legend>
                    <span>{tx(lang, g.name)}</span>
                    <small>
                      {g.required ? t(lang, "required") : g.max ? `${t(lang, "chooseUpTo")} ${g.max}` : t(lang, "optional")}
                    </small>
                  </legend>
                  {g.choices.map((c) => {
                    const on = (choices[g.id] ?? []).includes(c.id);
                    return (
                      <label key={c.id} className={`opt ${on ? "on" : ""}`}>
                        <input
                          type={g.type === "single" ? "radio" : "checkbox"}
                          name={`${item.id}-${g.id}`}
                          checked={on}
                          onChange={() => toggle(g.id, c.id, g.type === "single", g.max)}
                        />
                        <span className="opt-name">{tx(lang, c.name)}</span>
                        {c.priceDelta > 0 && <span className="opt-price">+{birr(c.priceDelta, lang)}</span>}
                      </label>
                    );
                  })}
                </fieldset>
              ))}

              {canOrder && features.orderNotes && (
                <label className="note-field">
                  <span>{t(lang, "note")}</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(lang, "notePh")} maxLength={120} />
                </label>
              )}
              {fasting && <p className="fasting-ok">🌿 {lang === "am" ? "ይህ ምርጫ የጾም ነው" : "This choice is fasting-friendly"}</p>}
            </>
          )}

          {features.upselling && pairs.length > 0 && (
            <div className="pairs">
              <h3>{t(lang, "pairs")}</h3>
              <div className="pairs-row">
                {pairs.map((p) => (
                  <button key={p.id} className="pair" onClick={() => onOpen(p)} disabled={p.soldOut}>
                    {features.photos && <Photo className="pair-photo" src={p.photo} alt="" icon={CATEGORIES.find((c) => c.id === p.categoryId)?.icon ?? "🍽"} />}
                    <span className="pair-name">{tx(lang, p.name)}</span>
                    <span className="pair-price">{p.soldOut ? t(lang, "soldOut") : birr(p.price, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!item.soldOut && canOrder && (
          <div className="sheet-footer">
            <div className="qty" aria-label={t(lang, "qty")}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="−">
                −
              </button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="+">
                +
              </button>
            </div>
            <button className="btn-primary grow" onClick={add}>
              {t(lang, "add")} · {birr(price * qty, lang)}
            </button>
          </div>
        )}
        {!item.soldOut && !canOrder && (
          <div className="sheet-footer">
            <p className="view-only">{birr(price, lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
