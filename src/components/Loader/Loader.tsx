import loaderMark from "../../assets/plant-centar-znak.svg";
import "./Loader.css";

type LoaderProps = {
  label?: string;
  overlay?: boolean;
  compact?: boolean;
};

export default function Loader({
  label = "Učitavanje sadržaja",
  overlay = false,
  compact = false,
}: LoaderProps) {
  const className = [
    "shop-loader",
    overlay ? "shop-loader--overlay" : "",
    compact ? "shop-loader--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} role="status" aria-live="polite" aria-label={label}>
      <div className="shop-loader__circle" aria-hidden="true">
        <img src={loaderMark} alt="" className="shop-loader__mark" />
      </div>
      <span className="shop-loader__label">{label}</span>
    </div>
  );
}
