/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material";


interface SortProps {
  onSortChange: (sortBy: string) => void;
}

const Sort: React.FC<SortProps> = ({ onSortChange }) => {
  const [sortValue, setSortValue] = useState("nameAsc");

  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSortValue(value);
    onSortChange(value);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 200, mx: "auto", textAlign: "center" }}>
      <FormControl fullWidth>
        <InputLabel id="sort-select-label">Sortiraj</InputLabel>
        <Select
          labelId="sort-select-label"
          id="sort-select"
          value={sortValue}
          label="Sortiraj"
          onChange={handleSortChange}
        >
          <MenuItem value="nameAsc">Naziv: A-Z</MenuItem>
          <MenuItem value="nameDesc">Naziv: Z-A</MenuItem>
          <MenuItem value="priceAsc">Cena: manja-veća</MenuItem>
          <MenuItem value="priceDesc">Cena: veća-manja</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default Sort;
