import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { Checkbox, FormControlLabel, Box, Typography, Collapse } from "@mui/material";
import "./Filter.css";

type FilterProps = {
  onFilterChange: (filters: { manufacturers: string[] }) => void;
};

const Filter: React.FC<FilterProps> = ({ onFilterChange }) => {
  // Get subcategory from URL if present.
  const { subCategory } = useParams<{ subCategory?: string }>();
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        let q;
        if (subCategory) {
          q = query(collection(db, "products"), where("subcategory", "==", subCategory));
        } else {
          q = collection(db, "products");
        }
        const querySnapshot = await getDocs(q);
        const fetched = new Set<string>();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.manufacturer) {
            fetched.add(data.manufacturer);
          }
        });
        setManufacturers(Array.from(fetched));
        setSelectedManufacturers(Array.from(fetched));
        onFilterChange({ manufacturers: Array.from(fetched) });
      } catch (error) {
        console.error("Error fetching manufacturers:", error);
      }
    };

    fetchManufacturers();
  }, [subCategory]);

  const handleCheckboxChange = (manufacturer: string) => {
    setSelectedManufacturers((prev) => {
      const newSelection = prev.includes(manufacturer)
        ? prev.filter((m) => m !== manufacturer)
        : [...prev, manufacturer];
      onFilterChange({ manufacturers: newSelection });
      return newSelection;
    });
  };

  return (
    <Box className="filter-container">
      <Box className="filter-header" onClick={() => setDrawerOpen(!drawerOpen)}>
        <FilterAltIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ ml: 1 }}>
          Proizvođač
        </Typography>
      </Box>
      <Collapse in={drawerOpen} timeout="auto" unmountOnExit>
        <Box className="filter-options">
          {manufacturers.map((m, index) => (
            <FormControlLabel
              key={index}
              control={
                <Checkbox
                  checked={selectedManufacturers.includes(m)}
                  onChange={() => handleCheckboxChange(m)}
                  color="primary"
                />
              }
              label={m}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default Filter;
