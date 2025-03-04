import React, { useState, useEffect } from "react";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { Checkbox, FormControlLabel, Box, Typography, Collapse } from "@mui/material";
import "./Filter.css";

type FilterProps = {
  // The parent passes the current manufacturer list,
  // derived from the up-to-date products array
  availableManufacturers: string[];

  // When the user toggles a manufacturer checkbox,
  // we notify the parent with the selected list
  onFilterChange: (filters: { manufacturers: string[] }) => void;
};

const Filter: React.FC<FilterProps> = ({
  availableManufacturers,
  onFilterChange,
}) => {
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Whenever the parent changes the availableManufacturers list,
  // decide how to update the local "selected" list.
  // Options:
  // 1) Reset entirely (setSelectedManufacturers([]))
  // 2) Keep only those previously selected if they still exist in the new list
  //    (the example below demonstrates the second approach)
  useEffect(() => {
    setSelectedManufacturers((prev) =>
      prev.filter((m) => availableManufacturers.includes(m))
    );
  }, [availableManufacturers]);

  // Toggle selection
  const handleCheckboxChange = (manufacturer: string) => {
    setSelectedManufacturers((prev) => {
      let newSelection;
      if (prev.includes(manufacturer)) {
        newSelection = prev.filter((m) => m !== manufacturer);
      } else {
        newSelection = [...prev, manufacturer];
      }

      // Notify the parent about the new selection
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
          {availableManufacturers?.map((m) => (
            <FormControlLabel
              key={m}
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
