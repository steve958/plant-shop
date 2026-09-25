import { type PackageOption, type ProductOptions, availabilityLabels, effectivePackagePrice, effectivePrice, isOrderable, packageHasDiscount, productHasDiscount } from '../../data/productOptions';
import { useLayoutEffect, useRef, useState } from "react";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import productPlaceholder from "../../assets/product-placeholder.svg";
import "./ProductCard.css";

type Product = ProductOptions & {
  productId: string;
  name: string;
  price: number;
  images: string[];
  manufacturer?: string;
  packaging?: string;
  description?: string;
  onDiscount?: boolean;
  discountPrice?: number;
};

interface ProductCardProps {
  product: Product;
  /** When set, the card represents this single package of the product. */
  packageOption?: PackageOption;
  onClick: (productId: string, packageId?: string) => void;
  onAddToCart?: (productId: string, packageId?: string) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

export default function ProductCard({
  product,
  packageOption,
  onClick,
  onAddToCart,
}: ProductCardProps) {
  const imageSource = product.images?.[0]?.trim() || productPlaceholder;
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const image = imageRef.current;
    setImageLoaded(Boolean(image?.complete && image.naturalWidth > 0));
  }, [imageSource]);

  const multiPackage = !packageOption && Boolean(product.packages?.length);
  const hasDiscount = packageOption ? packageHasDiscount(packageOption) : productHasDiscount(product);
  const currentPrice = packageOption ? effectivePackagePrice(packageOption) : effectivePrice(product);
  const regularPrice = packageOption ? packageOption.price : product.price;
  const discountPercent = !hasDiscount
    ? 0
    : multiPackage
      ? Math.round(Math.max(...product.packages!.filter(packageHasDiscount).map((option) => (option.price - option.discountPrice!) / option.price)) * 100)
      : Math.round(((regularPrice - currentPrice) / regularPrice) * 100);
  const availability = packageOption?.availability || product.availability || 'on_order';
  const packagingLabel = packageOption?.label || product.packaging;
  const openProduct = () => onClick(product.productId, packageOption?.id);

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = productPlaceholder;
  };

  return (
    <article className="catalog-card">
      <button
        className={`catalog-card__media ${imageLoaded ? "catalog-card__media--loaded" : ""}`}
        type="button"
        onClick={openProduct}
        aria-label={`Pogledaj proizvod ${product.name}`}
      >
        {hasDiscount && (
          <span className="catalog-card__badge">{multiPackage ? "do " : ""}−{discountPercent}%</span>
        )}
        <img
          ref={imageRef}
          src={imageSource}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={imageLoaded ? "is-loaded" : ""}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />
        <span className="catalog-card__details">
          Detalji
          <ArrowForwardIcon aria-hidden="true" />
        </span>
      </button>

      <div className="catalog-card__content">
        <div className="catalog-card__meta">
          <span className="catalog-card__brand">
            {product.manufacturer || "Plant Centar preporuka"}
          </span>
          {packagingLabel && <span className="catalog-card__packaging">{packagingLabel}</span>}
        </div>
        <small>{multiPackage ? `${product.packages!.length} pakovanja · Izaberite pakovanje` : availabilityLabels[availability]}</small>
        <h3>
          <button type="button" onClick={openProduct}>
            {product.name}
          </button>
        </h3>
        <p>
          {product.description ||
            "Pouzdan proizvod iz pažljivo odabranog Plant Centar asortimana."}
        </p>

        <div className="catalog-card__footer">
          <div className="catalog-card__price">
            {hasDiscount && !multiPackage && <del>{formatPrice(regularPrice)} RSD</del>}
            <strong>{multiPackage ? "Od " : ""}{formatPrice(currentPrice)} RSD</strong>
          </div>
          {!multiPackage && availability === 'on_order' ? (
            <button
              className="catalog-card__cart catalog-card__cart--inquiry"
              type="button"
              onClick={openProduct}
              aria-label={`Pošaljite upit za ${product.name}`}
              title="Na upit — kontaktirajte nas"
            >
              <PhoneInTalkOutlinedIcon aria-hidden="true" />
            </button>
          ) : (
            <button
              className="catalog-card__cart"
              type="button"
              onClick={() => multiPackage ? openProduct() : onAddToCart?.(product.productId, packageOption?.id)}
              disabled={!onAddToCart || (!multiPackage && !isOrderable(availability))}
              aria-label={`Dodaj ${product.name} u korpu`}
            >
              <ShoppingBagOutlinedIcon aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
