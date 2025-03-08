/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./NavBar.css";

import herbIconLogo from '../../assets/zastita/herbicidi-White.png'
import fungiIconLogo from '../../assets/zastita/fungicidi-White.png'
import insectIconLogo from '../../assets/zastita/insekticidi-White.png'
import organicIconLogo from '../../assets/zastita/organski-White.png'

import basicFertIcon from '../../assets/ishrana/osnovna-White.png'
import cristalFertIcon from '../../assets/ishrana/kristalna-White.png'
import liquidFertIcon from '../../assets/ishrana/tecna-White.png'
import organicFertIcon from '../../assets/ishrana/organska-White.png'
import bioFertIcon from '../../assets/ishrana/mikrobioloska-White.png'
import microelFertIcon from '../../assets/ishrana/mikroelementi-White.png'

import wheatLogo from '../../assets/seme/ratarske-White.png'
import vegetablesLogo from '../../assets/seme/povrce-White.png'
import fruitLogo from '../../assets/seme/voce-White.png'
import flowersLogo from '../../assets/seme/ukrasno-White.png'

import petsLogo from '../../assets/pet/kucni-White.png'
import equipmentLogo from '../../assets/pet/oprema-White.png'
import livestockLogo from '../../assets/pet/domace-White.png'

import machinesLogo from '../../assets/garden/masine-White.png'
import toolsLogo from '../../assets/garden/alati-White.png'
import irigationLogo from '../../assets/garden/navodnjavanje-White.png'
import foilsLogo from '../../assets/garden/folije-White.png'
import substrateLogo from '../../assets/garden/supstrati-White.png'
import potsLogo from '../../assets/garden/saksije-White.png'
import gardenLogo from '../../assets/garden/namestaj-White.png'
import workSuitsLogo from '../../assets/garden/htz-White.png'

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
      {
        label: "Organski preparati",
        route: "/podkategorija/Organski preparati",
        subItemIcon: organicIconLogo
      },
    ],
  },
  {
    label: "Ishrana bilja",
    route: "/ishrana",
    subItems: [
      {
        label: "Osnovna granulisana đubriva",
        route: "/podkategorija/Osnovna granulisana đubriva",
        subItemIcon: basicFertIcon
      },
      {
        label: "Kristalna vodootopiva đubriva",
        route: "/podkategorija/Kristalna vodootopiva đubriva",
        subItemIcon: cristalFertIcon
      },
      {
        label: "Tečna đubriva i biostimulatori",
        route: "/podkategorija/Tečna đubriva i biostimulatori",
        subItemIcon: liquidFertIcon
      },
      {
        label: "Đubriva na bazi mikroelemenata",
        route: "/podkategorija/Đubriva na bazi mikroelemenata",
        subItemIcon: microelFertIcon
      },
      {
        label: "Organska đubriva i poboljšivači zemljišta",
        route: "/podkategorija/Organska đubriva i poboljšivači zemljišta",
        subItemIcon: organicFertIcon
      },
      {
        label: "Mikrobiološka đubriva",
        route: "/podkategorija/Mikrobiološka đubriva",
        subItemIcon: bioFertIcon
      },
    ],
  },
  {
    label: "Seme i sadnice",
    route: "/seme",
    subItems: [
      {
        label: "Seme ratarskih kultura",
        route: "/podkategorija/Seme ratarskih kultura",
        subItemIcon: wheatLogo
      },
      {
        label: "Seme povrtarskih kultura",
        route: "/podkategorija/Seme povrtarskih kultura",
        subItemIcon: vegetablesLogo
      },
      {
        label: "Sadnice ukrasnog bilja",
        route: "/podkategorija/Sadnice ukrasnog bilja",
        subItemIcon: flowersLogo
      },
      { label: "Sadnice voća", route: "/podkategorija/Sadnice voća", subItemIcon: fruitLogo },
    ],
  },
  {
    label: "Pet program",
    route: "/pet-program",
    subItems: [
      {
        label: "Hrana za kućne ljubimce",
        route: "/podkategorija/Hrana za kućne ljubimce",
        subItemIcon: petsLogo
      },
      {
        label: "Oprema za kućne ljubimce",
        route: "/podkategorija/Oprema za kućne ljubimce",
        subItemIcon: equipmentLogo
      },
      {
        label: "Hrana za domaće životinje",
        route: "/podkategorija/Hrana za domaće životinje",
        subItemIcon: livestockLogo
      },
    ],
  },
  {
    label: "Garden oprema i alati",
    route: "/garden-program",
    subItems: [
      { label: "Mašine", route: "/podkategorija/Mašine", subItemIcon: machinesLogo },
      { label: "Alati", route: "/podkategorija/Alati", subItemIcon: toolsLogo },
      {
        label: "Oprema za navodnjavanje",
        route: "/podkategorija/Oprema za navodnjavanje",
        subItemIcon: irigationLogo
      },
      { label: "Folije i veziva", route: "/podkategorija/Folije i veziva", subItemIcon: foilsLogo },
      {
        label: "Supstrati malčevi i zemlja za cveće",
        route: "/podkategorija/Supstrati malčevi i zemlja za cveće",
        subItemIcon: substrateLogo
      },
      {
        label: "Saksije i žardinjere",
        route: "/podkategorija/Saksije i žardinjere",
        subItemIcon: potsLogo
      },
      {
        label: "Baštenski nameštaj",
        route: "/podkategorija/Baštenski nameštaj",
        subItemIcon: gardenLogo
      },
      {
        label: "HTZ oprema",
        route: "/podkategorija/HTZ oprema",
        subItemIcon: workSuitsLogo
      },
    ],
  },
];

export default function NavBar() {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<
    string | null
  >(null);
  const navRef = useRef<HTMLElement | null>(null);

  // Close any open dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
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
    <nav ref={navRef}>
      {/* Desktop Menu */}
      <div className="desktop-menu">
        <div className="nav-bar-container">
          {navItems.map((item, index) => (
            <div
              key={index}
              className="nav-item"
              onMouseEnter={() => {
                // Open dropdown on hover if sub-items exist
                if (item.subItems.length > 0) setActiveDropdown(item.label);
              }}
              onMouseLeave={() => {
                // Close dropdown when the mouse leaves this nav item
                setActiveDropdown(null);
              }}
              onClick={() => {
                // If no sub-categories, navigate immediately
                if (item.subItems.length === 0) handleNavigate(item.route);
              }}
            >
              <h3>{item.label}</h3>
              {item.subItems.length > 0 && (
                <div
                  className={`dropdown-menu ${activeDropdown === item.label ? "open" : ""
                    }`}
                >
                  {item.subItems.map((subItem, subIndex) => (
                    <div
                      key={subIndex}
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
        <div
          className="hamburger-icon"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        {isMobileMenuOpen && (
          <div className="mobile-nav-items">
            {navItems.map((item, index) => (
              <div key={index} className="mobile-nav-item">
                <div className="mobile-nav-item-header">
                  <h3
                    onClick={() => {
                      // If no sub-categories, navigate directly
                      if (item.subItems.length === 0)
                        handleNavigate(item.route);
                    }}
                  >
                    {item.label}
                  </h3>
                  {item.subItems.length > 0 && (
                    <button
                      className="mobile-dropdown-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMobileDropdown(item.label);
                      }}
                    >
                      {activeMobileDropdown === item.label ? "−" : "+"}
                    </button>
                  )}
                </div>
                {item.subItems.length > 0 &&
                  activeMobileDropdown === item.label && (
                    <div className="mobile-dropdown">
                      {item.subItems.map((subItem, subIndex) => (
                        <div
                          key={subIndex}
                          className="mobile-dropdown-item"
                          onClick={() => handleNavigate(subItem.route)}
                        >
                          {subItem.label}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
