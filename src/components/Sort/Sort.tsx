import { useState } from "react";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./Sort.css";

interface SortProps {
  onSortChange: (sortBy: string) => void;
}

const Sort = ({ onSortChange }: SortProps) => {
  const [sortValue, setSortValue] = useState("nameAsc");

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortValue(event.target.value);
    onSortChange(event.target.value);
  };

  return (
    <label className="catalog-sort">
      <span className="catalog-sort__icon">
        <SortOutlinedIcon aria-hidden="true" />
      </span>
      <span className="catalog-sort__copy">
        <small>Prikaz proizvoda</small>
        <strong>Sortiranje</strong>
      </span>
      <select value={sortValue} onChange={handleSortChange}>
        <option value="nameAsc">Naziv: A–Z</option>
        <option value="nameDesc">Naziv: Z–A</option>
        <option value="priceAsc">Cena: od niže</option>
        <option value="priceDesc">Cena: od više</option>
      </select>
      <ExpandMoreIcon className="catalog-sort__chevron" aria-hidden="true" />
    </label>
  );
};

export default Sort;
