import "./SubCategoryStyle.css";
import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import { ScaleLoader } from "react-spinners";
import Sort from "../Sort/Sort";
import Filter from "../Filter/Filter";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";
import ProductCard from "../ProductCard/ProductCard";

type Product = {
    productId: string;
    name: string;
    price: number;
    images: string[];
    gender: string;
    type: string;
    category: string;
    size: string[];
    manufacturer: string;
};

export default function SubCategoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Sorting
    const [sortBy, setSortBy] = useState<string>("nameAsc");

    // Manufacturer filter
    const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);

    // React Router
    const navigate = useNavigate();
    const { subCategory } = useParams<{ subCategory: string }>();

    // Global search from Redux
    const searchQuery = useSelector((state: RootState) => state.search.query);

    // 1) Fetch products by subcategory on mount or when subCategory changes
    useEffect(() => {
        const fetchProducts = async () => {
            if (!subCategory) return;
            setLoading(true);
            try {
                const q = query(
                    collection(db, "products"),
                    where("subcategory", "==", subCategory)
                );
                const querySnapshot = await getDocs(q);
                const fetchedProducts: Product[] = querySnapshot.docs.map((doc) => ({
                    productId: doc.id,
                    ...doc.data(),
                })) as Product[];

                setProducts(fetchedProducts);
            } catch (error) {
                console.error("Error fetching products for subcategory:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [subCategory]);

    // 2) Compute unique manufacturers from the fetched products
    const availableManufacturers = useMemo(() => {
        const uniqueSet = new Set<string>();
        products.forEach((p) => {
            if (p.manufacturer) {
                uniqueSet.add(p.manufacturer);
            }
        });
        return Array.from(uniqueSet);
    }, [products]);

    // 3) Filter products by search query and user-selected manufacturers
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

    // 4) Sort the filtered products
    const sortedProducts = useMemo(() => {
        const sorted = [...filteredProducts];
        switch (sortBy) {
            case "nameDesc":
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "priceAsc":
                sorted.sort((a, b) => a.price - b.price);
                break;
            case "priceDesc":
                sorted.sort((a, b) => b.price - a.price);
                break;
            default: // "nameAsc"
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        return sorted;
    }, [filteredProducts, sortBy]);

    // 5) Handlers
    const handleSortChange = (sort: string) => {
        setSortBy(sort);
    };

    const handleFilterChange = (filters: { manufacturers: string[] }) => {
        setManufacturerFilter(filters.manufacturers);
    };

    const handleProductClick = (productId: string) => {
        navigate(`/proizvod/${productId}`);
    };

    // 6) Render
    return (
        <div className="sub-category-page-container">
            <h2 className="sub-category-title">{subCategory}</h2>
            {loading ? (
                <div className="loader">
                    <ScaleLoader color="#54C143" />
                </div>
            ) : (
                <div className="sub-page-wrapper">
                    {/* Unified Sidebar: Sort on top, Filter below */}
                    <div className="sidebar">
                        <div className="sort-filter-wrapper">
                            <Sort onSortChange={handleSortChange} />
                            <Filter
                                onFilterChange={handleFilterChange}
                                availableManufacturers={availableManufacturers}
                            />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="sub-main-content">
                        {sortedProducts.length === 0 ? (
                            <div className="empty-message">Nema proizvoda po datom kriterijumu</div>
                        ) : (
                            <Box
                                className="products-container"
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    gap: 3,
                                    justifyContent: "center",
                                }}
                            >
                                {sortedProducts.map((product) => (
                                    <Box key={product.productId}>
                                        <ProductCard product={product} onClick={handleProductClick} />
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
