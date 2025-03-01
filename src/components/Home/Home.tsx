import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";
import "./Home.css";
import { ScaleLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import Sort from "../Sort/Sort";
import Filter from "../Filter/Filter";
import ProductCard from "../ProductCard/ProductCard";

type Product = {
  productId: string;
  name: string;
  price: number;
  images: string[];
  type: string;
  category: string;
  gender: string;
  size: string[];
  manufacturer: string;
  onDiscount?: boolean;
  discountPrice?: number;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("nameAsc");
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);

  const searchQuery = useSelector((state: RootState) => state.search.query);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Query only discounted products
        const q = query(
          collection(db, "products"),
          where("onDiscount", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const fetchedProducts: Product[] = querySnapshot.docs.map((doc) => ({
          productId: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search query and manufacturer filter.
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesManufacturer =
        manufacturerFilter.length === 0 ||
        manufacturerFilter.includes(product.manufacturer);
      return matchesSearch && matchesManufacturer;
    });
  }, [products, searchQuery, manufacturerFilter]);

  // Sort the filtered products.
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortBy === "nameAsc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "nameDesc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "priceAsc") {
      sorted.sort((a, b) => {
        const priceA = a.onDiscount ? a.discountPrice || a.price : a.price;
        const priceB = b.onDiscount ? b.discountPrice || b.price : b.price;
        return priceA - priceB;
      });
    } else if (sortBy === "priceDesc") {
      sorted.sort((a, b) => {
        const priceA = a.onDiscount ? a.discountPrice || a.price : a.price;
        const priceB = b.onDiscount ? b.discountPrice || b.price : b.price;
        return priceB - priceA;
      });
    }
    return sorted;
  }, [filteredProducts, sortBy]);

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleFilterChange = (filters: { manufacturers: string[] }) => {
    setManufacturerFilter(filters.manufacturers);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/proizvod/${productId}`);
  };

  return (
    <div className="home-page-container">
      {loading ? (
        <div className="loader">
          <ScaleLoader color="#54C143" />
        </div>
      ) : (
        <div className="home-page-wrapper">
          {/* Unified Sidebar: Sort on top and Filter below */}
          <div className="sidebar">
            <div className="sort-filter-wrapper">
              <Sort onSortChange={handleSortChange} />
              <Filter onFilterChange={handleFilterChange} />
            </div>
          </div>
          {/* Main content area for products */}
          <div className="home-main-content">
            <div className="home-products-grid">
              {sortedProducts.length === 0 ? (
                <div className="empty-message">
                  Nema proizvoda po datom kriterijumu
                </div>
              ) : (
                sortedProducts.map((product) => (
                  <ProductCard
                    key={product.productId}
                    product={product}
                    onClick={handleProductClick}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
