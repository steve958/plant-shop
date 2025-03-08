import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./EditItemModal.css";
import { Checkbox, FormControlLabel } from "@mui/material";

type Product = {
  productId: string;
  name: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  price: number;
  images: string[];
  description: string;
  discountPrice?: number;
  onDiscount?: boolean;
};

// Define the categories and their corresponding subcategories
const categoriesData = [
  {
    label: "Zaštita bilja",
    subcategories: [
      "Herbicidi",
      "Fungicidi",
      "Insekticidi",
      "Organski preparati",
    ],
  },
  {
    label: "Ishrana bilja",
    subcategories: [
      "Osnovna granulisana đubriva",
      "Kristalna vodootopiva đubriva",
      "Tečna đubriva i biostimulatori",
      "Đubriva na bazi mikroelemenata",
      "Organska đubriva i poboljšivači zemljišta",
      "Mikrobiološka đubriva",
    ],
  },
  {
    label: "Seme i sadnice",
    subcategories: [
      "Seme ratarskih kultura",
      "Seme povrtarskih kultura",
      "Sadnice ukrasnog bilja",
      "Sadnice voća",
    ],
  },
  {
    label: "Pet program",
    subcategories: [
      "Hrana za kućne ljubimce",
      "Oprema za kućne ljubimce",
      "Hrana za domaće životinje",
    ],
  },
  {
    label: "Garden oprema i alati",
    subcategories: [
      "Mašine",
      "Alati",
      "Oprema za navodnjavanje",
      "Folije i veziva",
      "Supstrati malčevi i zemlja za cveće",
      "Saksije i žardinjere",
      "Baštenski nameštaj",
      "HTZ oprema"
    ],
  },
];

const EditItemModal: React.FC<{ product: Product; onClose: () => void }> = ({
  product,
  onClose,
}) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [subcategory, setSubcategory] = useState(product.subcategory);
  const [manufacturer, setManufacturer] = useState(product.manufacturer);
  const [price, setPrice] = useState(String(product.price));
  const [description, setDescription] = useState(product.description);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(product.images);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [subcategoriesOptions, setSubcategoriesOptions] = useState<string[]>(
    []
  );
  const [onDiscount, setOnDiscount] = useState(product.onDiscount || false);
  const [discountPrice, setDiscountPrice] = useState(
    product.discountPrice ? String(product.discountPrice) : ""
  );

  // Update the subcategory dropdown options when category changes
  useEffect(() => {
    const selectedCategory = categoriesData.find(
      (cat) => cat.label === category
    );
    if (selectedCategory) {
      setSubcategoriesOptions(selectedCategory.subcategories);
      // Reset subcategory if it doesn't belong to the new category
      if (!selectedCategory.subcategories.includes(subcategory)) {
        setSubcategory("");
      }
    } else {
      setSubcategoriesOptions([]);
      setSubcategory("");
    }
  }, [category, subcategory]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalImages = images.length + selectedFiles.length;
      if (totalImages > 5) {
        toast.error("Maksimalan broj slika je 5.");
        return;
      }
      setImages((prev) => [...prev, ...selectedFiles]);
      const previews = selectedFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  const removeImage = (index: number) => {
    const imageUrl = imagePreviews[index];
    setRemovedImages((prev) => [...prev, imageUrl]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    // Start with existing images
    const imageUrls: string[] = [...product.images];
    for (const image of images) {
      // Check if the image already exists by name (if applicable)
      const existingImageUrl = product.images.find((url) =>
        url.includes(image.name)
      );
      if (existingImageUrl) {
        imageUrls.push(existingImageUrl);
        continue;
      }
      // Upload new image
      const uniqueName = `${Date.now()}-${image.name}`;
      const imageRef = ref(storage, `images/${uniqueName}`);
      const uploadTask = uploadBytesResumable(imageRef, image);
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
      imageUrls.push(downloadURL);
    }
    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onDiscount && !discountPrice) {
      toast.error("Unesite novu cenu za proizvod na popustu.");
      return;
    }
    if (!category || !subcategory) {
      toast.error("Molimo vas izaberite kategoriju i podkategoriju.");
      return;
    }
    setLoading(true);
    try {
      // Upload any new images
      let imageUrls: string[] = product.images;
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }
      // Delete images that have been removed
      if (removedImages.length > 0) {
        await Promise.all(
          removedImages.map(async (imageUrl) => {
            const filename = decodeURIComponent(
              imageUrl.split("/").pop()?.split("?")[0] || ""
            );
            const imageRef = ref(storage, `images/${filename}`);
            await deleteObject(imageRef);
          })
        );
        imageUrls = imageUrls.filter((url) => !removedImages.includes(url));
      }
      // Update product in Firestore
      await updateDoc(doc(db, "products", product.productId), {
        name,
        category,
        subcategory,
        manufacturer,
        price: parseFloat(price),
        description,
        images: imageUrls,
        onDiscount,
        discountPrice: onDiscount ? parseFloat(discountPrice) : null,
      });
      toast.success("Proizvod uspešno izmenjen!");
      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Greška prilikom izmene proizvoda. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-item-modal-container" onClick={onClose}>
      <form
        className="edit-item-form"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Izmena proizvoda</h2>

        <div className="edit-form-group">
          <label htmlFor="name">Naziv:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="edit-form-group">
          <label htmlFor="category">Kategorija:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Izaberite kategoriju</option>
            {categoriesData.map((cat, index) => (
              <option key={index} value={cat.label}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="edit-form-group">
          <label htmlFor="subcategory">Podkategorija:</label>
          <select
            id="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            required
            disabled={!category}
          >
            <option value="">Izaberite podkategoriju</option>
            {subcategoriesOptions.map((sub, index) => (
              <option key={index} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="edit-form-group">
          <label htmlFor="manufacturer">Proizvođač:</label>
          <input
            id="manufacturer"
            type="text"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            required
          />
        </div>

        <div className="edit-form-group">
          <label htmlFor="price">Cena:</label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
          />
        </div>

        <div className="edit-form-group discount-wrapper">
          <FormControlLabel
            control={
              <Checkbox
                checked={onDiscount}
                onChange={(e) => setOnDiscount(e.target.checked)}
                color="primary"
              />
            }
            label="Na popustu"
          />
        </div>

        {onDiscount && (
          <div className="edit-form-group">
            <label htmlFor="manufacturer">Nova cena:</label>
            <input
              id="newprice"
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              required
              title="Nova cena proizvoda"
              placeholder="Unesite novu cenu"
            />
          </div>
        )}

        <div className="edit-form-group">
          <label htmlFor="description">Opis:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="edit-form-group">
          <label htmlFor="images">Slike:</label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
          />
          <div className="image-previews">
            {imagePreviews.map((preview, index) => (
              <div className="image-preview-container" key={index}>
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="image-preview"
                />
                <span
                  className="remove-image-icon"
                  onClick={() => removeImage(index)}
                >
                  X
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="edit-button-wrapper">
          <button className="add-button" type="submit" disabled={loading}>
            {loading
              ? `Izmena ${Math.round(uploadProgress)}%`
              : "Izmeni proizvod"}
          </button>
          <button className="cancel-button" type="button" onClick={onClose}>
            Otkaži
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditItemModal;
