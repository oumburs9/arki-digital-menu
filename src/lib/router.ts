import { useEffect, useState } from "react";

/** Base path: "/" on Vercel, "/arki-digital-menu/" on GitHub Pages. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const href = (p: string) => `${BASE}${p}`;
export const asset = (p: string) => `${BASE}/${p.replace(/^\//, "")}`;

const strip = (p: string) => (BASE && p.startsWith(BASE) ? p.slice(BASE.length) || "/" : p);

export function navigate(to: string) {
  history.pushState(null, "", href(to));
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** GitHub Pages serves 404.html for deep links; it passes the path back in ?p=. */
function restoreRedirect() {
  const q = new URLSearchParams(location.search);
  const p = q.get("p");
  if (p) history.replaceState(null, "", href(p));
}
restoreRedirect();

export function useLocation() {
  const [loc, setLoc] = useState(() => ({ path: strip(location.pathname), search: location.search }));
  useEffect(() => {
    const on = () => setLoc({ path: strip(location.pathname), search: location.search });
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  return loc;
}
