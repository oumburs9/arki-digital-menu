export type Lang = "en" | "am";
export type L10n = { en: string; am: string };

export type Allergen = "gluten" | "dairy" | "egg" | "nuts";
export type DietTag = "fasting" | "vegetarian" | "spicy" | "popular" | "new";

export interface OptionChoice {
  id: string;
  name: L10n;
  priceDelta: number; // ETB added to the base price
  /** Choosing this makes the item suitable for fasting (e.g. oat milk, oil instead of butter). */
  makesFasting?: boolean;
}

export interface OptionGroup {
  id: string;
  name: L10n;
  type: "single" | "multi";
  required?: boolean;
  max?: number;
  choices: OptionChoice[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: L10n;
  description: L10n;
  price: number; // ETB
  photo?: string;
  tags: DietTag[];
  allergens: Allergen[];
  /** Fasting-friendly with the right option chosen. */
  fastingOption?: boolean;
  options: OptionGroup[];
  pairsWith: string[]; // item ids for upselling
  soldOut: boolean;
  hidden?: boolean;
  prepMinutes?: number;
}

export interface Category {
  id: string;
  name: L10n;
  icon: string;
}

/**
 * Configuration layer. Arki decides which features a plan includes;
 * the business switches them on or off in its own settings.
 */
export interface FeatureFlags {
  ordering: boolean; // QR table ordering and cart
  amharic: boolean; // bilingual menu
  photos: boolean;
  filters: boolean; // fasting, dietary and allergen filters
  upselling: boolean;
  liveSoldOut: boolean;
  callWaiter: boolean;
  analytics: boolean;
  orderNotes: boolean;
}

export interface Tenant {
  slug: string;
  name: L10n;
  tagline: L10n;
  type: "cafe" | "restaurant" | "hotel";
  address: string;
  phone: string;
  currency: "ETB";
  tables: number;
  serviceChargePct: number;
  vatPct: number;
  owner: { email: string; password: string };
  features: FeatureFlags;
  plan: "starter" | "growth" | "enterprise";
}

export interface CartLine {
  key: string;
  itemId: string;
  qty: number;
  choices: Record<string, string[]>; // groupId -> choice ids
  note?: string;
  unitPrice: number;
}

export type OrderStatus = "new" | "preparing" | "served" | "cancelled";

export interface Order {
  id: string;
  number: number;
  table: string;
  lines: CartLine[];
  note?: string;
  subtotal: number;
  service: number;
  vat: number;
  total: number;
  status: OrderStatus;
  createdAt: number;
  lang: Lang;
}

export interface WaiterCall {
  id: string;
  table: string;
  reason: "waiter" | "bill";
  createdAt: number;
  done: boolean;
}

export type EventKind = "menu_open" | "item_view" | "add_to_cart" | "order_placed" | "upsell_added" | "filter_used";
export interface AnalyticsEvent {
  kind: EventKind;
  itemId?: string;
  value?: number;
  at: number;
}
