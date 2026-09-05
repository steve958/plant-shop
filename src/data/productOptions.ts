export type Availability = 'in_stock' | 'on_order' | 'out_of_stock';
export type PackageOption = { id: string; label: string; price: number; availability: Availability };
export type ProductOptions = { archived?: boolean; availability?: Availability; packages?: PackageOption[] };
export const availabilityLabels: Record<Availability, string> = {
  in_stock: 'Na stanju', on_order: 'Mogućnost poručivanja', out_of_stock: 'Nema na stanju',
};
export const cartKey = (item: { productId: string; packageId?: string }) =>
  JSON.stringify([item.productId, item.packageId || '']);
