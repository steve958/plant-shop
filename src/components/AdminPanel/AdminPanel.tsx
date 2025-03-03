import { useEffect, useState, useMemo } from 'react';
import { db, storage } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import './AdminPanel.css';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddItemModal from '../Modals/NewItemModal';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import { ScaleLoader } from 'react-spinners';
import EditItemModal from '../Modals/EditItemModal';
import Filter from '../Filter/Filter';
import Sort from '../Sort/Sort';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/store';
import CheckIcon from '@mui/icons-material/Check';
import { Button, Dialog, DialogContent, DialogActions } from '@mui/material';

type Product = {
  productId: string;
  name: string;
  type: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  gender: 'male' | 'female';
  size: string[];
  price: number;
  images: string[];
  description: string;
  onDiscount?: boolean;
  discountPrice?: number;
};

export default function AdminPanel() {
  const [newItemClicked, setNewItemClicked] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number[]>([]);

  // If true, triggers a fresh product fetch
  const [refreshProducts, setRefreshProducts] = useState(false);

  const [editItemClicked, setEditItemClicked] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Confirmation modal for deletion
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    productId: string;
    images: string[];
  } | null>(null);

  // Filter/Sort states
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('nameAsc');
  const searchQuery = useSelector((state: RootState) => state.search.query);

  // ---------- Data Fetch Logic ----------
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsCollection = collection(db, 'products');
      const productSnapshot = await getDocs(productsCollection);
      const productList = productSnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Product, 'productId'>;
        return { productId: doc.id, ...data };
      });
      setProducts(productList);
      setFilteredProducts(productList);
      setSelectedImageIndex(Array(productList.length).fill(0));
    } catch (error) {
      console.error('Error fetching products: ', error);
    } finally {
      setLoading(false);
      setRefreshProducts(false); // Once fetch is done, we reset
    }
  };

  // 1) Initial fetch on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // 2) Re-fetch if refreshProducts becomes true
  useEffect(() => {
    if (refreshProducts) {
      fetchProducts();
    }
  }, [refreshProducts]);

  // ---------- Handlers ----------
  const handleNewItemClicked = () => {
    setNewItemClicked(true);
  };

  const handleCloseAddItemModal = () => {
    setNewItemClicked(false);
    setRefreshProducts(true); // Trigger re-fetch after adding a product
  };

  const handleEditItemClick = (product: Product) => {
    setSelectedProduct(product);
    setEditItemClicked(true);
  };

  const handleCloseEditItemModal = () => {
    setEditItemClicked(false);
    setSelectedProduct(null);
    setRefreshProducts(true); // Re-fetch after editing
  };

  // Update main image
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
      const productRef = doc(db, 'products', selectedProductId);
      await updateDoc(productRef, { images: newImages });
    } catch (error) {
      console.error('Error updating product images:', error);
    }
  };

  // Confirm Deletion
  const openDeleteModal = (
    event: React.MouseEvent<SVGSVGElement>,
    productId: string,
    images: string[]
  ) => {
    event.stopPropagation();
    setDeleteTarget({ productId, images });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // Final Deletion
  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const { productId, images } = deleteTarget;
    try {
      const productDocRef = doc(db, 'products', productId);
      await deleteDoc(productDocRef);

      const deleteImagePromises = images.map((image) => {
        const imageRef = ref(storage, image);
        return deleteObject(imageRef);
      });
      await Promise.all(deleteImagePromises);

      setProducts((prev) => prev.filter((p) => p.productId !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      closeDeleteModal();
    }
  };

  // Utility: Format price
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  // ---------- Filtering & Sorting ----------
  const filteredData = useMemo(() => {
    let updated = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (manufacturerFilter.length > 0) {
      updated = updated.filter((p) =>
        manufacturerFilter.includes(p.manufacturer)
      );
    }
    return updated;
  }, [products, searchQuery, manufacturerFilter]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (sortBy === 'nameAsc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'nameDesc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'priceAsc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      sorted.sort((a, b) => b.price - a.price);
    }
    return sorted;
  }, [filteredData, sortBy]);

  // Update displayed products
  useEffect(() => {
    setFilteredProducts(sortedData);
  }, [sortedData]);

  // ---------- Event handlers for Filter/Sort ----------
  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
  };

  const handleFilterChange = (filters: { manufacturers: string[] }) => {
    setManufacturerFilter(filters.manufacturers);
  };

  return (
    <div className="admin-panel-container">
      {/* Add / Edit Modals */}
      {newItemClicked && <AddItemModal onClose={handleCloseAddItemModal} />}
      {editItemClicked && selectedProduct && (
        <EditItemModal
          product={selectedProduct}
          onClose={handleCloseEditItemModal}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onClose={closeDeleteModal}>
        <DialogContent>
          Da li ste sigurni da želite da obrišete ovaj proizvod?
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteModal} color="inherit">
            Odustani
          </Button>
          <Button onClick={handleDeleteConfirmed} color="error">
            Obriši
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-sort-filter-wrapper">
          <Sort onSortChange={handleSortChange} />
          <Filter onFilterChange={handleFilterChange} />
        </div>
      </div>

      {/* Main Area */}
      <div className="admin-main-content">
        <div className="add-product-button" onClick={handleNewItemClicked}>
          <AddCircleIcon sx={{ fontSize: 40 }} />
          <span>Dodaj Proizvod</span>
        </div>

        {loading ? (
          <div className="loader">
            <ScaleLoader color="#54C143" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <p>Nema proizvoda za prikaz.</p>
        ) : (
          <div className="table-container">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Naziv</th>
                  <th>Kategorija</th>
                  <th>Podkategorija</th>
                  <th>Cena</th>
                  <th>Na popustu</th>
                  <th>Slike</th>
                  <th>Akcija</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product.productId}
                    onClick={() => handleEditItemClick(product)}
                    className="product-row"
                  >
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.subcategory}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      {product.onDiscount ? (
                        <CheckIcon style={{ color: 'green' }} />
                      ) : null}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="images-wrapper">
                        <div className="thumbnails-row">
                          {product.images.map((img, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={img}
                              alt={`Image ${imgIndex + 1}`}
                              className={`thumbnail ${
                                imgIndex === 0 ? 'main-image' : ''
                              } ${
                                selectedImageIndex[index] === imgIndex
                                  ? 'selected'
                                  : ''
                              }`}
                              onClick={() => handleImageSelect(index, imgIndex)}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <DeleteIcon
                        className="delete-icon"
                        onClick={(event) =>
                          openDeleteModal(
                            event,
                            product.productId,
                            product.images
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
