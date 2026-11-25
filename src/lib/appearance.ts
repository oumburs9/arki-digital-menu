import { useEffect } from "react";
import type { Appearance, ThemeId } from "../types";

/** Theme presets. The colours themselves live in styles.css under [data-theme="…"]. */
export const THEMES: Record<ThemeId, { name: string; mood: string; swatch: [string, string, string]; dark?: boolean }> = {
  emerald: { name: "Emerald", mood: "Fresh and calm. Arki's signature green on warm paper.", swatch: ["#1A7A50", "#F7F4EE", "#0E2A1D"] },
  espresso: { name: "Espresso", mood: "Warm coffee browns on cream. Made for coffee houses.", swatch: ["#6B4226", "#F8F3EC", "#2B1A10"] },
  midnight: { name: "Midnight", mood: "Dark and elegant with gold. Hotels, lounges, evening service.", swatch: ["#D4A24C", "#0F1412", "#F3EEE3"], dark: true },
  terracotta: { name: "Terracotta", mood: "Earthy clay and teff tones. Traditional and restaurant menus.", swatch: ["#B4532A", "#FAF4EE", "#3A1D10"] },
  ocean: { name: "Ocean", mood: "Crisp blue and white. Modern hotels and business venues.", swatch: ["#1F5F8B", "#F5F8FA", "#0F2536"] },
};

export const HEADINGS: Record<Appearance["headings"], string> = { serif: "Classic serif", sans: "Modern sans" };
export const LAYOUTS: Record<Appearance["layout"], string> = { list: "List: photo beside text", grid: "Grid: photo cards, two per row" };
export const CORNERS: Record<Appearance["corners"], string> = { soft: "Soft", round: "Round", sharp: "Sharp" };

/** data-* attributes that switch the CSS variables for an appearance. */
export const appearanceAttrs = (a: Appearance) => ({
  "data-theme": a.theme,
  "data-headings": a.headings,
  "data-layout": a.layout,
  "data-corners": a.corners,
});

/** Applies an appearance to the whole document (guest menu), so sheets, page background and overscroll match. */
export function useDocumentAppearance(a: Appearance) {
  useEffect(() => {
    const el = document.documentElement;
    const attrs = appearanceAttrs(a);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    const meta = document.querySelector('meta[name="theme-color"]');
    const prevColor = meta?.getAttribute("content");
    meta?.setAttribute("content", THEMES[a.theme].dark ? THEMES[a.theme].swatch[1] : THEMES[a.theme].swatch[0]);
    return () => {
      Object.keys(attrs).forEach((k) => el.removeAttribute(k));
      if (prevColor) meta?.setAttribute("content", prevColor);
    };
  }, [a.theme, a.headings, a.layout, a.corners]);
}

/** Compact form for the Arki console's live preview URL: theme.headings.layout.corners */
export const encodeAppearance = (a: Appearance) => [a.theme, a.headings, a.layout, a.corners].join(".");
export function decodeAppearance(v: string | null): Appearance | null {
  if (!v) return null;
  const [theme, headings, layout, corners] = v.split(".");
  if (!(theme in THEMES) || !(headings in HEADINGS) || !(layout in LAYOUTS) || !(corners in CORNERS)) return null;
  return { theme: theme as ThemeId, headings: headings as Appearance["headings"], layout: layout as Appearance["layout"], corners: corners as Appearance["corners"] };
}
