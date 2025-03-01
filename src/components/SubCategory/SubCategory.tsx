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
import "./SubCategory.css";

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
    const [sortBy, setSortBy] = useState<string>("nameAsc");
    const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);

    const navigate = useNavigate();
    const { subCategory } = useParams<{ subCategory: string }>();
    const searchQuery = useSelector((state: RootState) => state.search.query);

    useEffect(() => {
        const fetchProducts = async () => {
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

        if (subCategory) {
            fetchProducts();
        }
    }, [subCategory]);

    // Filter products based on search query and selected manufacturers.
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
            sorted.sort((a, b) => a.price - b.price);
        } else if (sortBy === "priceDesc") {
            sorted.sort((a, b) => b.price - a.price);
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
                            <Filter onFilterChange={handleFilterChange} />
                        </div>
                    </div>
                    {/* Main Content Area */}
                    <div className="sub-main-content">
                        {sortedProducts.length === 0 ? (
                            <div className="empty-message">
                                Nema proizvoda po datom kriterijumu
                            </div>
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
                                    <Box key={product.productId} sx={{ width: 345 }}>
                                        <ProductCard
                                            product={product}
                                            onClick={handleProductClick}
                                        />
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
