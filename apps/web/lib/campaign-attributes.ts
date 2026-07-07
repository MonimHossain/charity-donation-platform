/** Sort campaign donation attributes for display (lower sortOrder = further left on the public page). */
export function sortCampaignAttributes<T extends { sortOrder?: number }>(attributes: T[]): T[] {
  return [...attributes].sort((a, b) => {
    const aOrder = Number.isFinite(a.sortOrder) ? Number(a.sortOrder) : 0;
    const bOrder = Number.isFinite(b.sortOrder) ? Number(b.sortOrder) : 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return 0;
  });
}

export function syncAttributeSortOrders<T extends { sortOrder?: number }>(attributes: T[]): T[] {
  return sortCampaignAttributes(attributes).map((attr, index) => ({
    ...attr,
    sortOrder: index,
  }));
}

export function hasDuplicateAttributeSortOrders(attributes: Array<{ sortOrder?: number }>): boolean {
  const orders = attributes.map((a) => a.sortOrder);
  return new Set(orders).size !== orders.length;
}

/** Swap display positions (sortOrder) between two attributes by id. */
export function swapAttributeSortOrders<T extends { id: string; sortOrder?: number }>(
  attributes: T[],
  idA: string,
  idB: string
): T[] {
  const a = attributes.find((x) => x.id === idA);
  const b = attributes.find((x) => x.id === idB);
  if (!a || !b) return attributes;
  const orderA = a.sortOrder ?? 0;
  const orderB = b.sortOrder ?? 0;
  return attributes.map((attr) => {
    if (attr.id === idA) return { ...attr, sortOrder: orderB };
    if (attr.id === idB) return { ...attr, sortOrder: orderA };
    return attr;
  });
}

export function nextAttributeSortOrder(attributes: Array<{ sortOrder?: number }>): number {
  if (attributes.length === 0) return 0;
  return Math.max(...attributes.map((a) => (Number.isFinite(a.sortOrder) ? Number(a.sortOrder) : 0))) + 1;
}
