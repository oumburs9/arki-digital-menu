import { t } from "../lib/i18n";
import type { Lang, MenuItem } from "../types";
import Icon from "./Icon";

export default function Tags({ item, lang }: { item: MenuItem; lang: Lang }) {
  const fasting = item.tags.includes("fasting");
  return (
    <div className="tags">
      {item.tags.includes("popular") && (
        <span className="tag tag-popular">
          <Icon name="star" size={12} strokeWidth={2.2} /> {t(lang, "popular")}
        </span>
      )}
      {item.tags.includes("new") && (
        <span className="tag tag-new">
          <Icon name="sparkles" size={12} strokeWidth={2.2} /> {t(lang, "new")}
        </span>
      )}
      {fasting && (
        <span className="tag tag-fasting">
          <Icon name="leaf" size={12} strokeWidth={2.2} /> {t(lang, "fasting")}
        </span>
      )}
      {!fasting && item.fastingOption && (
        <span className="tag tag-fasting-opt">
          <Icon name="leaf" size={12} strokeWidth={2.2} /> {t(lang, "fastingOk")}
        </span>
      )}
      {item.tags.includes("vegetarian") && !fasting && <span className="tag">{t(lang, "vegetarian")}</span>}
      {item.tags.includes("spicy") && (
        <span className="tag tag-spicy">
          <Icon name="flame" size={12} strokeWidth={2.2} /> {t(lang, "spicy")}
        </span>
      )}
    </div>
  );
}
