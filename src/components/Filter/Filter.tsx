import { useEffect, useMemo, useState } from "react";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import "./Filter.css";

type FilterProps = {
  availableManufacturers: string[];
  onFilterChange: (filters: { manufacturers: string[] }) => void;
};

const Filter = ({ availableManufacturers, onFilterChange }: FilterProps) => {
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 761px)").matches
  );

  useEffect(() => {
    const availableSelection = selectedManufacturers.filter((manufacturer) =>
      availableManufacturers.includes(manufacturer)
    );

    if (availableSelection.length !== selectedManufacturers.length) {
      setSelectedManufacturers(availableSelection);
      onFilterChange({ manufacturers: availableSelection });
    }
  }, [availableManufacturers, onFilterChange, selectedManufacturers]);

  const visibleManufacturers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("sr-Latn");
    return [...availableManufacturers]
      .sort((first, second) => first.localeCompare(second, "sr"))
      .filter((manufacturer) =>
        manufacturer.toLocaleLowerCase("sr-Latn").includes(normalizedSearch)
      );
  }, [availableManufacturers, searchTerm]);

  const updateSelection = (nextSelection: string[]) => {
    setSelectedManufacturers(nextSelection);
    onFilterChange({ manufacturers: nextSelection });
  };

  const toggleManufacturer = (manufacturer: string) => {
    const nextSelection = selectedManufacturers.includes(manufacturer)
      ? selectedManufacturers.filter((item) => item !== manufacturer)
      : [...selectedManufacturers, manufacturer];
    updateSelection(nextSelection);
  };

  const clearFilters = () => {
    setSearchTerm("");
    updateSelection([]);
  };

  return (
    <section className="catalog-filter" aria-label="Filteri proizvoda">
      <button
        className="catalog-filter__header"
        type="button"
        onClick={() => setDrawerOpen((open) => !open)}
        aria-expanded={drawerOpen}
      >
        <span className="catalog-filter__header-icon">
          <FilterAltOutlinedIcon aria-hidden="true" />
        </span>
        <span className="catalog-filter__header-copy">
          <small>Filteri</small>
          <strong>Proizvođač</strong>
        </span>
        {selectedManufacturers.length > 0 && (
          <span className="catalog-filter__count">
            {selectedManufacturers.length}
          </span>
        )}
        <ExpandMoreIcon
          className={`catalog-filter__chevron${drawerOpen ? " is-open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {drawerOpen && (
        <div className="catalog-filter__body">
          {selectedManufacturers.length > 0 && (
            <div className="catalog-filter__selected" aria-label="Aktivni filteri">
              {selectedManufacturers.map((manufacturer) => (
                <button
                  key={manufacturer}
                  type="button"
                  onClick={() => toggleManufacturer(manufacturer)}
                  title={`Ukloni filter ${manufacturer}`}
                >
                  {manufacturer}
                  <CloseIcon aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          <label className="catalog-filter__search">
            <SearchOutlinedIcon aria-hidden="true" />
            <span>Pretražite proizvođače</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pronađite brend..."
            />
          </label>

          <div className="catalog-filter__options">
            {visibleManufacturers.length > 0 ? (
              visibleManufacturers.map((manufacturer) => (
                <label key={manufacturer} className="catalog-filter__option">
                  <input
                    type="checkbox"
                    checked={selectedManufacturers.includes(manufacturer)}
                    onChange={() => toggleManufacturer(manufacturer)}
                  />
                  <span className="catalog-filter__checkbox" aria-hidden="true" />
                  <span>{manufacturer}</span>
                </label>
              ))
            ) : (
              <p className="catalog-filter__empty">
                Nema proizvođača za ovu pretragu.
              </p>
            )}
          </div>

          <div className="catalog-filter__footer">
            <span>{availableManufacturers.length} dostupnih</span>
            <button
              type="button"
              onClick={clearFilters}
              disabled={selectedManufacturers.length === 0 && !searchTerm}
            >
              Poništi filtere
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Filter;
