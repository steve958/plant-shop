import { useEffect, useState } from "react";
import { db } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { addToCart } from "../Redux/cartSlice";
import { toast } from "react-toastify";
import "./ItemDetails.css";

type Product = {
  productId: string;
  name: string;
  price: number;
  images: string[];
  description?: string;
  category?: string;
  subcategory?: string;
  manufacturer?: string;
};

export default function ItemDetails() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        if (!productId) throw new Error("Product ID is undefined");
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            productId: docSnap.id,
            name: data.name,
            price: data.price,
            images: data.images || [],
            description: data.description || "",
            category: data.category || "",
            subcategory: data.subcategory || "",
            manufacturer: data.manufacturer || "",
          });
          setSelectedImage(data.images?.[0] || null);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching product details: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("sr-RS", {
      style: "currency",
      currency: "RSD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setQuantity(val > 0 ? val : 1);
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addToCart({
        productId: product.productId,
        name: product.name,
        price: product.price,
        image: selectedImage || "",
        quantity,
      })
    );
    toast.success("Proizvod je uspešno dodat u korpu!");
    setTimeout(() => {
      navigate("/početna");
    }, 1500);
  };

  return (
    <div className="item-details-container">
      {loading ? (
        <div className="loader">Učitavanje...</div>
      ) : product ? (
        <div className="item-details-wrapper">
          {/* Left: Product Images */}
          <div className="product-images">
            <div className="main-image-container">
              <img
                src={selectedImage || "placeholder.jpg"}
                alt={product.name}
                className="main-image"
              />
            </div>
            <div className="thumbnail-strip">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className={`thumbnail ${selectedImage === img ? "active" : ""
                    }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="product-details">
            <h1 className="product-title">{product.name}</h1>
            <p className="product-price">{formatPrice(product.price)}</p>
            <p className="old-price">14.499,00 RSD</p>
            <p className="discount-text">Ušteda: 5.000,00 RSD</p>
            {product.description && <p className="product-desc">{product.description}</p>}

            <div className="quantity-actions">
              <label>Količina:</label>
              <div className="quantity-input-wrapper">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  –
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  title="Količina proizvoda"
                  placeholder="Unesite količinu"
                />
                <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>
                  +
                </button>
              </div>
            </div>

            <button className="add-to-cart-button" onClick={handleAddToCart}>
              Dodaj u korpu
            </button>
          </div>
        </div>
      ) : (
        <p>Proizvod nije pronađen.</p>
      )}
    </div>
  );
}
