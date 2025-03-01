import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./MalePage.css";
import { ScaleLoader } from "react-spinners";
import Filter from "../Filter/Filter";
import Sort from "../Sort/Sort"; // Import the Sort component
import { useSelector } from 'react-redux';
import { RootState } from "../Redux/store";

type Product = {
  productId: string;
  name: string;
  price: number;
  images: string[];
  gender: string;
  type: string;
  category: string;
  size: string[];
};

export default function MalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    types: [] as string[],
    categories: [] as string[],
    genders: [] as string[],
    sizes: [] as string[],
  });
  const [sortBy, setSortBy] = useState<string>('');

  const navigate = useNavigate();
  const searchQuery = useSelector((state: RootState) => state.search.query);

  useEffect(() => {
    const fetchMaleProducts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "products"),
          where("gender", "==", "male")
        );

        const querySnapshot = await getDocs(q);
        const fetchedProducts: Product[] = querySnapshot.docs.map((doc) => ({
          productId: doc.id,
          ...doc.data(),
        })) as Product[];

        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching male products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaleProducts();
  }, []);

  useEffect(() => {
    const applyFiltersAndSort = () => {
      let updatedProducts = [...products];


      if (searchQuery) {
        updatedProducts = updatedProducts.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }


      if (filters.types.length > 0) {
        updatedProducts = updatedProducts.filter((product) =>
          filters.types.includes(product.type)
        );
      }

      if (filters.categories.length > 0) {
        updatedProducts = updatedProducts.filter((product) =>
          filters.categories.includes(product.category)
        );
      }

      if (filters.genders.length > 0) {
        updatedProducts = updatedProducts.filter((product) =>
          filters.genders.includes(product.gender)
        );
      }

      if (filters.sizes.length > 0) {
        updatedProducts = updatedProducts.filter((product) =>
          product.size.some((size) => filters.sizes.includes(size))
        );
      }

      // Apply sorting
      if (sortBy === "nameAsc") {
        updatedProducts.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === "nameDesc") {
        updatedProducts.sort((a, b) => b.name.localeCompare(a.name));
      } else if (sortBy === "priceAsc") {
        updatedProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === "priceDesc") {
        updatedProducts.sort((a, b) => b.price - a.price);
      }

      setFilteredProducts(updatedProducts);
    };

    applyFiltersAndSort();
  }, [filters, products, searchQuery, sortBy]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS", {
      style: "currency",
      currency: "RSD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/proizvod/${productId}`);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sortBy: string) => {
    setSortBy(sortBy);
  };

  return (
    <div className="male-page-container">
      <div className="sort-filter-wrapper">
        <Sort onSortChange={handleSortChange} />
        <Filter onFilterChange={handleFilterChange} />
      </div>

      {loading ? (
        <div className="loader">
          <ScaleLoader color="#54C143" />
        </div>
      ) : (
        <div className="male-products-grid">
          {filteredProducts.map((product) => (
            <div
              className="male-product-card"
              key={product.productId}
              onClick={() => handleProductClick(product.productId)}
            >
              <img
                src={product.images[0]}
                alt={product.name}
                className="male-product-image"
                loading="lazy"
              />
              <h3 className="male-product-name">{product.name}</h3>
              <p className="male-product-price">{formatPrice(product.price)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
