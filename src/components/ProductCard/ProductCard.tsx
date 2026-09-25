import { type ProductOptions, availabilityLabels, effectivePrice, packageHasDiscount, productHasDiscount } from '../../data/productOptions';
import { useLayoutEffect, useRef, useState } from "react";
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
  onClick: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

export default function ProductCard({
  product,
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

  const hasDiscount = productHasDiscount(product);
  const currentPrice = effectivePrice(product);
  const discountBase = product.packages?.length
    ? product.packages.filter(packageHasDiscount).reduce<{ regular: number; percent: number } | null>((best, option) => {
        const percent = (option.price - option.discountPrice!) / option.price;
        return !best || percent > best.percent ? { regular: option.price, percent } : best;
      }, null)
    : hasDiscount
      ? { regular: product.price, percent: (product.price - product.discountPrice!) / product.price }
      : null;
  const discountPercent = discountBase ? Math.round(discountBase.percent * 100) : 0;

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = productPlaceholder;
  };

  return (
    <article className="catalog-card">
      <button
        className={`catalog-card__media ${imageLoaded ? "catalog-card__media--loaded" : ""}`}
        type="button"
        onClick={() => onClick(product.productId)}
        aria-label={`Pogledaj proizvod ${product.name}`}
      >
        {hasDiscount && (
          <span className="catalog-card__badge">−{discountPercent}%</span>
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
          {product.packaging && <span className="catalog-card__packaging">{product.packaging}</span>}
        </div>
        <small>{product.packages?.length ? `${product.packages.length} pakovanja · Izaberite pakovanje` : availabilityLabels[product.availability || 'on_order']}</small>
        <h3>
          <button type="button" onClick={() => onClick(product.productId)}>
            {product.name}
          </button>
        </h3>
        <p>
          {product.description ||
            "Pouzdan proizvod iz pažljivo odabranog Plant Centar asortimana."}
        </p>

        <div className="catalog-card__footer">
          <div className="catalog-card__price">
            {hasDiscount && discountBase && <del>{formatPrice(discountBase.regular)} RSD</del>}
            <strong>{product.packages?.length ? "Od " : ""}{formatPrice(currentPrice)} RSD</strong>
          </div>
          <button
            className="catalog-card__cart"
            type="button"
            onClick={() => product.packages?.length ? onClick(product.productId) : onAddToCart?.(product.productId)}
            disabled={!onAddToCart || (!product.packages?.length && product.availability === 'out_of_stock')}
            aria-label={`Dodaj ${product.name} u korpu`}
          >
            <ShoppingBagOutlinedIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
