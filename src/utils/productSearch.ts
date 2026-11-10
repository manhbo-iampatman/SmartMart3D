import type { Product } from "../types";

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").toLowerCase().trim().replace(/\s+/g, " ");
}

export function matchesProduct(product: Product, query: string): boolean {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  const searchable = normalizeSearch(`${product.name} ${product.category}`);
  return terms.every((term) => searchable.includes(term));
}
