import { useEffect, useState } from "react";
import { ITEMS, TENANTS } from "../data/seed";
import type { Appearance, AnalyticsEvent, EventKind, FeatureFlags, MenuItem, Order, OrderStatus, Tenant, WaiterCall } from "../types";

/**
 * Data layer for the demo. Everything goes through this repository, so it can
 * later be swapped for the Arki platform API (orders, kitchen, stock, payments)
 * without changing the screens.
 *
 * Demo storage: the browser's localStorage, with live updates between tabs on
 * the same device through BroadcastChannel and storage events.
 */

interface TenantState {
  items: MenuItem[];
  features: FeatureFlags;
  appearance: Appearance;
  orders: Order[];
  calls: WaiterCall[];
  events: AnalyticsEvent[];
  nextOrderNumber: number;
}

const KEY = (slug: string) => `arki-menu:v1:${slug}`;
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("arki-menu") : null;
const listeners = new Set<(slug: string) => void>();

function seedState(t: Tenant): TenantState {
  return {
    items: structuredClone(ITEMS),
    features: { ...t.features },
    appearance: { ...t.appearance },
    orders: [],
    calls: [],
    events: [],
    nextOrderNumber: 101,
  };
}

const memory = new Map<string, TenantState>();

function load(slug: string): TenantState {
  const t = getTenant(slug);
  if (!t) throw new Error(`Unknown restaurant: ${slug}`);
  try {
    const raw = localStorage.getItem(KEY(slug));
    if (raw) {
      const s = JSON.parse(raw) as TenantState;
      // Saved before appearance existed: start from the delivered default.
      if (!s.appearance) s.appearance = { ...t.appearance };
      return s;
    }
  } catch {
    /* storage unavailable: fall back to memory */
  }
  if (!memory.has(slug)) memory.set(slug, seedState(t));
  return memory.get(slug)!;
}

function save(slug: string, s: TenantState) {
  memory.set(slug, s);
  try {
    localStorage.setItem(KEY(slug), JSON.stringify(s));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(slug));
  channel?.postMessage({ slug });
}

function update(slug: string, fn: (s: TenantState) => void) {
  const s = load(slug);
  fn(s);
  save(slug, s);
}

channel?.addEventListener("message", (e) => listeners.forEach((l) => l(e.data.slug)));
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key?.startsWith("arki-menu:v1:")) return;
    const slug = e.key.slice("arki-menu:v1:".length);
    memory.delete(slug);
    listeners.forEach((l) => l(slug));
  });
}

export function getTenant(slug: string): Tenant | undefined {
  return TENANTS.find((t) => t.slug === slug);
}

/** Subscribes a component to one restaurant's live state. */
export type { TenantState };
export function useTenantState(slug: string): TenantState {
  const [state, setState] = useState(() => load(slug));
  useEffect(() => {
    setState(load(slug));
    const l = (s: string) => {
      if (s === slug) setState({ ...load(slug) });
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [slug]);
  return state;
}

export const repo = {
  setSoldOut(slug: string, itemId: string, soldOut: boolean) {
    update(slug, (s) => {
      const it = s.items.find((i) => i.id === itemId);
      if (it) it.soldOut = soldOut;
    });
  },
  updateItem(slug: string, item: MenuItem) {
    update(slug, (s) => {
      s.items = s.items.map((i) => (i.id === item.id ? item : i));
    });
  },
  setFeature(slug: string, key: keyof FeatureFlags, on: boolean) {
    update(slug, (s) => {
      s.features[key] = on;
    });
  },
  /** Super admin only (Arki console). */
  setAppearance(slug: string, appearance: Appearance, by: string) {
    update(slug, (s) => {
      s.appearance = { ...appearance, appliedAt: Date.now(), appliedBy: by };
    });
  },
  placeOrder(slug: string, order: Omit<Order, "id" | "number" | "status" | "createdAt">): Order {
    let placed!: Order;
    update(slug, (s) => {
      placed = { ...order, id: crypto.randomUUID(), number: s.nextOrderNumber++, status: "new", createdAt: Date.now() };
      s.orders.unshift(placed);
    });
    return placed;
  },
  setOrderStatus(slug: string, orderId: string, status: OrderStatus) {
    update(slug, (s) => {
      const o = s.orders.find((x) => x.id === orderId);
      if (o) o.status = status;
    });
  },
  callWaiter(slug: string, table: string, reason: WaiterCall["reason"]) {
    update(slug, (s) => {
      s.calls.unshift({ id: crypto.randomUUID(), table, reason, createdAt: Date.now(), done: false });
    });
  },
  resolveCall(slug: string, id: string) {
    update(slug, (s) => {
      const c = s.calls.find((x) => x.id === id);
      if (c) c.done = true;
    });
  },
  track(slug: string, kind: EventKind, itemId?: string, value?: number) {
    const s = load(slug);
    if (!s.features.analytics) return;
    update(slug, (st) => {
      st.events.push({ kind, itemId, value, at: Date.now() });
      if (st.events.length > 5000) st.events = st.events.slice(-5000);
    });
  },
  resetDemo(slug: string) {
    const t = getTenant(slug);
    if (t) save(slug, seedState(t));
  },
};
