import { t } from "../lib/i18n";
import type { Lang, MenuItem } from "../types";

export default function Tags({ item, lang }: { item: MenuItem; lang: Lang }) {
  return (
    <div className="tags">
      {item.tags.includes("popular") && <span className="tag tag-popular">★ {t(lang, "popular")}</span>}
      {item.tags.includes("new") && <span className="tag tag-new">{t(lang, "new")}</span>}
      {item.tags.includes("fasting") && <span className="tag tag-fasting">🌿 {t(lang, "fasting")}</span>}
      {!item.tags.includes("fasting") && item.fastingOption && <span className="tag tag-fasting-opt">🌿 {t(lang, "fastingOk")}</span>}
      {item.tags.includes("vegetarian") && !item.tags.includes("fasting") && <span className="tag">{t(lang, "vegetarian")}</span>}
      {item.tags.includes("spicy") && <span className="tag tag-spicy">🌶 {t(lang, "spicy")}</span>}
    </div>
  );
}
