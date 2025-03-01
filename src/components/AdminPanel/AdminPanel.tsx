import { useEffect, useState, useMemo } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import "./AdminPanel.css";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddItemModal from "../Modals/NewItemModal";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import { ScaleLoader } from "react-spinners";
import EditItemModal from "../Modals/EditItemModal";
import Filter from "../Filter/Filter";
import Sort from "../Sort/Sort";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";

type Product = {
  productId: string;
  name: string;
  type: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  gender: "male" | "female";
  size: string[];
  price: number;
  images: string[];
  description: string;
};

export default function AdminPanel() {
  const [newItemClicked, setNewItemClicked] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number[]>([]);
  const [refreshProducts, setRefreshProducts] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );
  const [editItemClicked, setEditItemClicked] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter and sort states
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("nameAsc");

  const searchQuery = useSelector((state: RootState) => state.search.query);

  // ---------- Data fetching and refresh ----------
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsCollection = collection(db, "products");
        const productSnapshot = await getDocs(productsCollection);
        const productList = productSnapshot.docs.map((doc) => {
          const data = doc.data() as Omit<Product, "productId">;
          return { productId: doc.id, ...data };
        });
        setProducts(productList);
        setFilteredProducts(productList);
        setSelectedImageIndex(Array(productList?.length).fill(0));
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
        setRefreshProducts(false);
      }
    };

    if (!refreshProducts) fetchProducts();
  }, [refreshProducts]);

  // ---------- Handlers ----------
  const handleNewItemClicked = () => {
    setNewItemClicked(true);
  };

  const handleCloseAddItemModal = () => {
    setNewItemClicked(false);
    setRefreshProducts(true);
  };

  const handleCloseEditItemModal = () => {
    setEditItemClicked(false);
    setSelectedProduct(null);
    setRefreshProducts(true);
  };

  const handleEditItemClick = (product: Product) => {
    setSelectedProduct(product);
    setEditItemClicked(true);
  };

  // ---------- Image selection and rearrangement ----------
  const handleImageSelect = async (
    productIndex: number,
    imageIndex: number
  ) => {
    const updatedSelectedImageIndex = [...selectedImageIndex];
    updatedSelectedImageIndex[productIndex] = imageIndex;
    setSelectedImageIndex(updatedSelectedImageIndex);

    const selectedProductId = filteredProducts[productIndex].productId;
    const newImages = [...filteredProducts[productIndex].images];
    const selectedImage = newImages.splice(imageIndex, 1)[0];
    newImages.unshift(selectedImage);

    try {
      const productRef = doc(db, "products", selectedProductId);
      await updateDoc(productRef, { images: newImages });
    } catch (error) {
      console.error("Error updating product images: ", error);
    }
  };

  // ---------- Delete ----------
  const deleteProduct = async (
    event: React.MouseEvent<SVGSVGElement>,
    productId: string,
    images: string[]
  ) => {
    event.stopPropagation();
    try {
      setDeletingProductId(productId);
      const productDocRef = doc(db, "products", productId);
      await deleteDoc(productDocRef);

      const deleteImagePromises = images.map((image) => {
        const imageRef = ref(storage, image);
        return deleteObject(imageRef);
      });
      await Promise.all(deleteImagePromises);

      setProducts((prev) => prev.filter((p) => p.productId !== productId));
    } catch (error) {
      console.error("Error deleting product: ", error);
    } finally {
      setDeletingProductId(null);
    }
  };

  // ---------- Utility ----------
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS", {
      style: "currency",
      currency: "RSD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // ---------- Filtering and Sorting ----------
  const filteredData = useMemo(() => {
    // 1. Apply search filter
    let updated = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // 2. Apply manufacturer filter
    if (manufacturerFilter.length > 0) {
      updated = updated.filter((p) => manufacturerFilter.includes(p.manufacturer));
    }
    return updated;
  }, [products, searchQuery, manufacturerFilter]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
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
  }, [filteredData, sortBy]);

  // Update filteredProducts state to reflect final sorted data
  useEffect(() => {
    setFilteredProducts(sortedData);
  }, [sortedData]);

  // ---------- Filter / Sort event handlers ----------
  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
  };

  const handleFilterChange = (filters: { manufacturers: string[] }) => {
    // In AdminPanel, we only track manufacturerFilter for now,
    // but you can expand if needed.
    setManufacturerFilter(filters.manufacturers);
  };

  return (
    <div className="admin-panel-container">
      {/* Modals */}
      {newItemClicked && <AddItemModal onClose={handleCloseAddItemModal} />}
      {editItemClicked && selectedProduct && (
        <EditItemModal
          product={selectedProduct}
          onClose={handleCloseEditItemModal}
        />
      )}

      {/* Left Sidebar: Sort & Filter in a single wrapper */}
      <div className="admin-sidebar">
        <div className="admin-sort-filter-wrapper">
          <Sort onSortChange={handleSortChange} />
          <Filter onFilterChange={handleFilterChange} />
        </div>
      </div>

      {/* Main Content: Product list */}
      <div className="admin-main-content">
        <div className="product-list">
          {/* Add Product Card */}
          <div className="add-item-card" onClick={handleNewItemClicked}>
            <AddCircleIcon className="add-icon" sx={{ fontSize: 80 }} />
          </div>

          {loading ? (
            <div className="loader">
              <ScaleLoader color="#54C143" />
            </div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <div
                key={product.productId}
                className="product-card"
                onClick={() => handleEditItemClick(product)}
              >
                <div className="product-image-container">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[selectedImageIndex[index]]}
                      alt={`Product image ${selectedImageIndex[index] + 1}`}
                      className="product-image"
                      loading="lazy"
                    />
                  ) : (
                    <p>Nema dostupnih slika.</p>
                  )}
                </div>
                {/* Thumbnails */}
                <div className="image-selector">
                  {product.images.map((image, imageIndex) => (
                    <img
                      key={imageIndex}
                      src={image}
                      alt={`Thumbnail ${imageIndex + 1}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleImageSelect(index, imageIndex);
                      }}
                      className={`thumbnail ${selectedImageIndex[index] === imageIndex ? "selected" : ""
                        }`}
                      loading="lazy"
                    />
                  ))}
                </div>
                <Tooltip
                  title={product.name}
                  arrow
                  placement="bottom"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        fontSize: "0.75rem",
                        bgcolor: "#fff",
                        color: "black",
                        p: 1,
                        border: "1px solid black",
                      },
                    },
                  }}
                >
                  <div className="item-title">{product.name}</div>
                </Tooltip>
                <div className="price-icon-wrapper">
                  <p>{formatPrice(product.price)}</p>
                  <DeleteIcon
                    onClick={(event) =>
                      !deletingProductId &&
                      deleteProduct(event, product.productId, product.images)
                    }
                    className="delete-icon"
                    style={{
                      cursor: deletingProductId ? "not-allowed" : "pointer",
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p>Nema proizvoda za prikaz.</p>
          )}
        </div>
      </div>
    </div>
  );
}
