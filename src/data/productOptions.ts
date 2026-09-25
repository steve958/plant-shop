export type Availability = 'in_stock' | 'on_order' | 'out_of_stock';
export type PackageOption = { id: string; label: string; price: number; discountPrice?: number; availability: Availability };
export type ProductOptions = { archived?: boolean; availability?: Availability; packages?: PackageOption[] };
export const availabilityLabels: Record<Availability, string> = {
  in_stock: 'Na stanju', on_order: 'Na upit', out_of_stock: 'Nema na stanju',
};
export const cartKey = (item: { productId: string; packageId?: string }) =>
  JSON.stringify([item.productId, item.packageId || '']);

export const packageHasDiscount = (option: PackageOption) =>
  Number.isFinite(option.discountPrice) && option.discountPrice! > 0 && option.discountPrice! < option.price;

export const effectivePackagePrice = (option: PackageOption) =>
  packageHasDiscount(option) ? option.discountPrice! : option.price;

type PricedProduct = ProductOptions & { price: number; onDiscount?: boolean; discountPrice?: number };

export const productHasDiscount = (product: PricedProduct) =>
  product.packages?.length
    ? product.packages.some(packageHasDiscount)
    : Boolean(product.onDiscount && product.discountPrice && product.discountPrice < product.price);

export const effectivePrice = (product: PricedProduct, packageId?: string) => {
  if (product.packages?.length) {
    if (packageId) {
      const selected = product.packages.find((option) => option.id === packageId);
      if (selected) return effectivePackagePrice(selected);
    }
    return Math.min(...product.packages.map(effectivePackagePrice));
  }
  return productHasDiscount(product) ? product.discountPrice! : product.price;
};
