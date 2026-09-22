import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
/* NavBar.tsx */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./NavBar.css";

// Import icons for various nav items
import herbIconLogo from '../../assets/zastita/herbicidi-White.png';
import fungiIconLogo from '../../assets/zastita/fungicidi-White.png';
import insectIconLogo from '../../assets/zastita/insekticidi-White.png';
import organicIconLogo from '../../assets/zastita/organski-White.png';
import rodenticidiIconLogo from '../../assets/zastita/rodenticidi-White.png';
import komunalnaIconLogo from '../../assets/zastita/komunalna-White.png';
import pomocnaIconLogo from '../../assets/zastita/pomocna-White.png';

import basicFertIcon from '../../assets/ishrana/osnovna-White.png';
import cristalFertIcon from '../../assets/ishrana/kristalna-White.png';
import liquidFertIcon from '../../assets/ishrana/tecna-White.png';
import organicFertIcon from '../../assets/ishrana/organska-White.png';
import bioFertIcon from '../../assets/ishrana/mikrobioloska-White.png';
import microelFertIcon from '../../assets/ishrana/mikroelementi-White.png';

import wheatLogo from '../../assets/seme/ratarske-White.png';
import vegetablesLogo from '../../assets/seme/povrce-White.png';
import fruitLogo from '../../assets/seme/voce-White.png';
import flowersLogo from '../../assets/seme/ukrasno-White.png';

import petsLogo from '../../assets/pet/kucni-White.png';
import equipmentLogo from '../../assets/pet/oprema-White.png';
import livestockLogo from '../../assets/pet/domace-White.png';

import machinesLogo from '../../assets/garden/masine-White.png';
import toolsLogo from '../../assets/garden/alati-White.png';
import irigationLogo from '../../assets/garden/navodnjavanje-White.png';
import foilsLogo from '../../assets/garden/folije-White.png';
import substrateLogo from '../../assets/garden/supstrati-White.png';
import potsLogo from '../../assets/garden/saksije-White.png';
import gardenLogo from '../../assets/garden/namestaj-White.png';
import workSuitsLogo from '../../assets/garden/htz-White.png';

const navItems = [
  {
    label: "Akcija",
    route: "/početna",
    subItems: [],
  },
  {
    label: "Zaštita bilja",
    route: "/zaštita",
    subItems: [
      { label: "Herbicidi", route: "/podkategorija/Herbicidi", subItemIcon: herbIconLogo },
      { label: "Fungicidi", route: "/podkategorija/Fungicidi", subItemIcon: fungiIconLogo },
      { label: "Insekticidi", route: "/podkategorija/Insekticidi", subItemIcon: insectIconLogo },
      { label: "Organski preparati", route: "/podkategorija/Organski preparati", subItemIcon: organicIconLogo },
      { label: "Rodenticidi", route: "/podkategorija/Rodenticidi", subItemIcon: rodenticidiIconLogo },
      { label: "Komunalna higijena", route: "/podkategorija/Komunalna higijena", subItemIcon: komunalnaIconLogo },
      { label: "Pomoćna sredstva", route: "/podkategorija/Pomoćna sredstva", subItemIcon: pomocnaIconLogo },
    ],
  },
  {
    label: "Ishrana bilja",
    route: "/ishrana",
    subItems: [
      { label: "Osnovna granulisana đubriva", route: "/podkategorija/Osnovna granulisana đubriva", subItemIcon: basicFertIcon },
      { label: "Kristalna vodootopiva đubriva", route: "/podkategorija/Kristalna vodootopiva đubriva", subItemIcon: cristalFertIcon },
      { label: "Tečna đubriva i biostimulatori", route: "/podkategorija/Tečna đubriva i biostimulatori", subItemIcon: liquidFertIcon },
      { label: "Đubriva na bazi mikroelemenata", route: "/podkategorija/Đubriva na bazi mikroelemenata", subItemIcon: microelFertIcon },
      { label: "Organska đubriva i poboljšivači zemljišta", route: "/podkategorija/Organska đubriva i poboljšivači zemljišta", subItemIcon: organicFertIcon },
      { label: "Mikrobiološka đubriva", route: "/podkategorija/Mikrobiološka đubriva", subItemIcon: bioFertIcon },
    ],
  },
  {
    label: "Seme i sadnice",
    route: "/seme",
    subItems: [
      { label: "Seme ratarskih kultura", route: "/podkategorija/Seme ratarskih kultura", subItemIcon: wheatLogo },
      { label: "Seme povrtarskih kultura", route: "/podkategorija/Seme povrtarskih kultura", subItemIcon: vegetablesLogo },
      { label: "Sadnice ukrasnog bilja", route: "/podkategorija/Sadnice ukrasnog bilja", subItemIcon: flowersLogo },
      { label: "Sadnice voća", route: "/podkategorija/Sadnice voća", subItemIcon: fruitLogo },
    ],
  },
  {
    label: "Pet program",
    route: "/pet-program",
    subItems: [
      { label: "Hrana za kućne ljubimce", route: "/podkategorija/Hrana za kućne ljubimce", subItemIcon: petsLogo },
      { label: "Oprema za kućne ljubimce", route: "/podkategorija/Oprema za kućne ljubimce", subItemIcon: equipmentLogo },
      { label: "Hrana za domaće životinje", route: "/podkategorija/Hrana za domaće životinje", subItemIcon: livestockLogo },
    ],
  },
  {
    label: "Garden oprema i alati",
    route: "/garden-program",
    subItems: [
      { label: "Mašine", route: "/podkategorija/Mašine", subItemIcon: machinesLogo },
      { label: "Alati", route: "/podkategorija/Alati", subItemIcon: toolsLogo },
      { label: "Oprema za navodnjavanje", route: "/podkategorija/Oprema za navodnjavanje", subItemIcon: irigationLogo },
      { label: "Folije i veziva", route: "/podkategorija/Folije i veziva", subItemIcon: foilsLogo },
      { label: "Supstrati malčevi i zemlja za cveće", route: "/podkategorija/Supstrati malčevi i zemlja za cveće", subItemIcon: substrateLogo },
      { label: "Saksije i žardinjere", route: "/podkategorija/Saksije i žardinjere", subItemIcon: potsLogo },
      { label: "Bašta i domaćinstvo", route: "/podkategorija/Bašta i domaćinstvo", subItemIcon: gardenLogo },
      { label: "HTZ oprema", route: "/podkategorija/HTZ oprema", subItemIcon: workSuitsLogo },
    ],
  },
];

export default function NavBar() {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  // Close open dropdowns when clicking outside the navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        navRef.current &&
        event.target instanceof Node &&
        !navRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
        setActiveMobileDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (route: string) => {
    navigate(route);
    // Close mobile menu after navigation
    setMobileMenuOpen(false);
    setActiveMobileDropdown(null);
  };

  const toggleMobileDropdown = (label: string) => {
    setActiveMobileDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <nav ref={navRef} className="shop-navigation" aria-label="Kategorije proizvoda">
      {/* Desktop Menu */}
      <div className="desktop-menu">
        <div className="nav-bar-container">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="nav-item"
              onMouseEnter={() => {
                if (item.subItems.length > 0) setActiveDropdown(item.label);
              }}
              onMouseLeave={() => setActiveDropdown(null)}
              onClick={() => {
                if (item.subItems.length === 0) handleNavigate(item.route);
              }}
            >
              <button className="nav-category-label" onClick={() => handleNavigate(item.subItems.length ? `/kategorija/${item.label}` : item.route)}>{item.label === "Akcija" && <LocalOfferOutlinedIcon />}{item.label}</button>
              {item.subItems.length > 0 && (
                <div className={`dropdown-menu ${activeDropdown === item.label ? "open" : ""}`}>
                  {item.subItems.map((subItem) => (
                    <div
                      key={subItem.label}
                      className="dropdown-item"
                      onClick={() => handleNavigate(subItem.route)}
                    >
                      <img
                        src={subItem.subItemIcon}
                        alt={`${subItem.label} icon`}
                        className="sub-item-icon"
                      />
                      {subItem.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="mobile-menu">
        <button
          type="button"
          className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Zatvori kategorije" : "Otvori kategorije"}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-lines" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </span>
          <strong>Kategorije proizvoda</strong>
        </button>
        <div className={`mobile-nav-items ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-title">
            <span>Prodavnica</span>
            <strong>Kategorije</strong>
          </div>
          {navItems.map((item) => (
            <div key={item.label} className="mobile-nav-item">
              <div className="mobile-nav-item-header">
                <button className="nav-category-label"
                  onClick={() => {
                    if (item.subItems.length === 0) handleNavigate(item.route); else toggleMobileDropdown(item.label);
                  }}
                >
                  {item.label === "Akcija" ? <LocalOfferOutlinedIcon /> : <img className="sub-item-icon" src={item.subItems[0]?.subItemIcon} alt="" />}{item.label}
                </button>
                {item.subItems.length > 0 && (
                  <button
                    className="mobile-dropdown-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMobileDropdown(item.label);
                    }}
                    aria-label={`Podkategorije: ${item.label}`}
                    aria-expanded={activeMobileDropdown === item.label}
                  >
                    {activeMobileDropdown === item.label ? "−" : "+"}
                  </button>
                )}
              </div>
              {item.subItems.length > 0 && (
                <div className={`mobile-dropdown ${activeMobileDropdown === item.label ? 'open' : ''}`} hidden={activeMobileDropdown !== item.label}>
                  <button className="mobile-dropdown-item" onClick={() => handleNavigate(`/kategorija/${item.label}`)}>Pogledaj sve — {item.label}</button>
                  {item.subItems.map((subItem) => (
                    <div
                      key={subItem.label}
                      className="mobile-dropdown-item"
                      onClick={() => handleNavigate(subItem.route)}
                    >
                      <img
                        src={subItem.subItemIcon}
                        alt={`${subItem.label} icon`}
                        className="sub-item-icon"
                      />
                      {subItem.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {isMobileMenuOpen && (
          <button
            className="mobile-nav-overlay"
            type="button"
            aria-label="Zatvori meni"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </nav>
  );
}
