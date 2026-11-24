import type { CartLine, MenuItem, Tenant } from "../types";

export function defaultChoices(item: MenuItem): Record<string, string[]> {
  const c: Record<string, string[]> = {};
  for (const g of item.options) c[g.id] = g.type === "single" && g.required ? [g.choices[0].id] : [];
  return c;
}

export function unitPrice(item: MenuItem, choices: Record<string, string[]>): number {
  let p = item.price;
  for (const g of item.options) for (const id of choices[g.id] ?? []) p += g.choices.find((c) => c.id === id)?.priceDelta ?? 0;
  return p;
}

export function isFastingChoice(item: MenuItem, choices: Record<string, string[]>): boolean {
  if (item.tags.includes("fasting")) {
    // An add-on like egg or yogurt breaks the fast.
    return !Object.values(choices).flat().some((id) => ["egg", "yogurt", "butter", "meat"].includes(id));
  }
  return item.options.some((g) => g.choices.some((c) => c.makesFasting && (choices[g.id] ?? []).includes(c.id)));
}

export function lineKey(itemId: string, choices: Record<string, string[]>, note?: string) {
  const parts = Object.keys(choices)
    .sort()
    .map((k) => `${k}:${[...choices[k]].sort().join("+")}`);
  return `${itemId}|${parts.join("|")}|${note ?? ""}`;
}

export function totals(lines: CartLine[], tenant: Tenant) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const service = Math.round(subtotal * tenant.serviceChargePct) / 100;
  const vat = Math.round((subtotal + service) * tenant.vatPct) / 100;
  return { subtotal, service, vat, total: Math.round((subtotal + service + vat) * 100) / 100 };
}

export function describeChoices(item: MenuItem, choices: Record<string, string[]>, lang: "en" | "am") {
  const out: string[] = [];
  for (const g of item.options) {
    for (const id of choices[g.id] ?? []) {
      const c = g.choices.find((x) => x.id === id);
      if (c) out.push(c.name[lang]);
    }
  }
  return out.join(" · ");
}
