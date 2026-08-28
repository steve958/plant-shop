import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import productPlaceholder from "../../assets/product-placeholder.svg";
import "./ProductCard.css";

type Product = {
  productId: string;
  name: string;
  price: number;
  images: string[];
  manufacturer?: string;
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
  const hasDiscount = Boolean(
    product.onDiscount &&
      product.discountPrice &&
      product.discountPrice < product.price
  );
  const currentPrice = hasDiscount ? product.discountPrice! : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - currentPrice) / product.price) * 100)
    : 0;

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = productPlaceholder;
  };

  return (
    <article className="catalog-card">
      <button
        className="catalog-card__media"
        type="button"
        onClick={() => onClick(product.productId)}
        aria-label={`Pogledaj proizvod ${product.name}`}
      >
        {hasDiscount && (
          <span className="catalog-card__badge">−{discountPercent}%</span>
        )}
        <img
          src={product.images?.[0]?.trim() || productPlaceholder}
          alt={product.name}
          loading="lazy"
          onError={handleImageError}
        />
        <span className="catalog-card__details">
          Detalji
          <ArrowForwardIcon aria-hidden="true" />
        </span>
      </button>

      <div className="catalog-card__content">
        <span className="catalog-card__brand">
          {product.manufacturer || "Plant Centar preporuka"}
        </span>
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
            {hasDiscount && <del>{formatPrice(product.price)} RSD</del>}
            <strong>{formatPrice(currentPrice)} RSD</strong>
          </div>
          <button
            className="catalog-card__cart"
            type="button"
            onClick={() => onAddToCart?.(product.productId)}
            disabled={!onAddToCart}
            aria-label={`Dodaj ${product.name} u korpu`}
          >
            <ShoppingBagOutlinedIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
