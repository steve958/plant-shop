import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { db, storage } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { RootState } from "../Redux/store";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./NewItemModal.css";

// Define the categories and their corresponding subcategories
const categoriesData = [
  {
    label: "Zaštita",
    subcategories: [
      "Herbicidi",
      "Fungicidi",
      "Insekticidi",
      "Organski preparati",
    ],
  },
  {
    label: "Ishrana",
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
    label: "Seme",
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
    label: "Garden program",
    subcategories: [
      "Mašine",
      "Alati",
      "Oprema za navodnjavanje",
      "Folije i veziva",
      "Supstrati malčevi i zemlja za cveće",
      "Saksije i žardinjere",
      "Baštenski nameštaj",
    ],
  },
];

const NewItemModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // State to manage subcategory dropdown options based on selected category
  const [subcategoriesOptions, setSubcategoriesOptions] = useState<string[]>([]);

  useEffect(() => {
    const selectedCategory = categoriesData.find(
      (cat) => cat.label === category
    );
    if (selectedCategory) {
      setSubcategoriesOptions(selectedCategory.subcategories);
    } else {
      setSubcategoriesOptions([]);
      setSubcategory("");
    }
  }, [category]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 5) {
        toast.error("Maksimalan broj slika je 5.");
        return;
      }
      setImages((prev) => [...prev, ...selectedFiles]);
      const previews = selectedFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const imageUrls: string[] = [];
    for (const image of images) {
      const uniqueName = `${Date.now()}-${image.name}`;
      const imageRef = ref(storage, `images/${uniqueName}`);
      const uploadTask = uploadBytesResumable(imageRef, image);
      try {
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
              } catch (err) {
                reject(err);
              }
            }
          );
        });
        imageUrls.push(downloadURL);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(`Error uploading image: ${image.name}`);
      }
    }
    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subcategory) {
      toast.error("Molimo vas izaberite kategoriju i podkategoriju.");
      return;
    }
    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      await addDoc(collection(db, "products"), {
        name,
        category,
        subcategory,
        manufacturer,
        price: parseFloat(price),
        description,
        images: imageUrls,
        onDiscount: false,
        discountPrice: null,
      });
      toast.success("Proizvod je uspešno dodat!");
      setName("");
      setCategory("");
      setSubcategory("");
      setManufacturer("");
      setPrice("");
      setDescription("");
      setImages([]);
      setImagePreviews([]);
      onClose();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Došlo je do greške prilikom dodavanja proizvoda. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.isAdmin) {
    return <p>Nemaš dozvolu da dodaješ proizvode.</p>;
  }

  return (
    <div className="new-item-modal-container" onClick={onClose}>
      <form
        className="new-item-form"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Dodavanje proizvoda</h2>
        <div className="new-item-input-wrapper">
          <label>Naziv:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            title="Unesite naziv proizvoda"
            placeholder="Unesite naziv proizvoda"
          />
        </div>
        <div className="new-item-input-wrapper">
          <label>Kategorija:</label>
          <select
            aria-label="Izaberite kategoriju proizvoda"
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
        <div className="new-item-input-wrapper">
          <label>Podkategorija:</label>
          <select
            aria-label="Izaberite podkategoriju proizvoda"
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
        <div className="new-item-input-wrapper">
          <label>Proizvođač:</label>
          <input
            type="text"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            required
            title="Unesite proizvođača"
            placeholder="Unesite naziv proizvođača"
          />
        </div>
        <div className="new-item-input-wrapper">
          <label>Cena:</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            title="Unesite cenu proizvoda"
            placeholder="Unesite cenu"
          />
        </div>
        <div className="new-item-input-wrapper">
          <label>Opis:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            title="Opis proizvoda"
            placeholder="Unesite opis proizvoda"
          />
        </div>
        <div className="new-item-input-wrapper">
          <label>Slike:</label>
          <input
            type="file"
            className="image-input"
            multiple
            onChange={handleImagesChange}
            required
            title="Izaberite slike za proizvod"
            placeholder="Izaberite slike za proizvod"
            aria-label="Izaberite slike za proizvod"
          />
          <div className="image-previews">
            {imagePreviews.map((preview, index) => (
              <div className="image-preview-wrapper" key={index}>
                <img
                  src={preview}
                  alt={`preview ${index}`}
                  className="image-preview"
                />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => handleRemoveImage(index)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="new-item-button-wrapper">
          <button className="add-button" type="submit" disabled={loading}>
            {loading
              ? `Dodavanje ${Math.round(uploadProgress)}%`
              : "Dodaj proizvod"}
          </button>
          <button className="close-button" type="button" onClick={onClose}>
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewItemModal;
