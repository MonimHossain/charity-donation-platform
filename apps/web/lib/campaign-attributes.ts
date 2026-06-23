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
