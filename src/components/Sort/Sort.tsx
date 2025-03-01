/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem, IconButton, Collapse, useMediaQuery, SelectChangeEvent } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SortIcon from "@mui/icons-material/Sort";

interface SortProps {
  onSortChange: (sortBy: string) => void;
}

const Sort: React.FC<SortProps> = ({ onSortChange }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [sortValue, setSortValue] = useState("nameAsc");

  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSortValue(value);
    onSortChange(value);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 200, mx: "auto", textAlign: "center" }}>
      {isSmallScreen ? (
        <>
          <IconButton
            onClick={() => setOpen(!open)}
            color="primary"
            sx={{ mb: 1 }}
            aria-label="toggle sort options"
          >
            <SortIcon />
          </IconButton>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <FormControl sx={{ mt: 2 }}>
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
          </Collapse>
        </>
      ) : (
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
      )}
    </Box>
  );
};

export default Sort;
