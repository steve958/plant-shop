/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./NavBar.css";

const navItems = [
  {
    label: "Akcija",
    route: "/početna",
    subItems: [],
  },
  {
    label: "Zaštita",
    route: "/zaštita",
    subItems: [
      { label: "Herbicidi", route: "/podkategorija/Herbicidi" },
      { label: "Fungicidi", route: "/podkategorija/Fungicidi" },
      { label: "Insekticidi", route: "/podkategorija/Insekticidi" },
      {
        label: "Organski preparati",
        route: "/podkategorija/Organski preparati",
      },
    ],
  },
  {
    label: "Ishrana",
    route: "/ishrana",
    subItems: [
      {
        label: "Osnovna granulisana đubriva",
        route: "/podkategorija/Osnovna granulisana đubriva",
      },
      {
        label: "Kristalna vodootopiva đubriva",
        route: "/podkategorija/Kristalna vodootopiva đubriva",
      },
      {
        label: "Tečna đubriva i biostimulatori",
        route: "/podkategorija/Tečna đubriva i biostimulatori",
      },
      {
        label: "Đubriva na bazi mikroelemenata",
        route: "/podkategorija/Đubriva na bazi mikroelemenata",
      },
      {
        label: "Organska đubriva i poboljšivači zemljišta",
        route: "/podkategorija/Organska đubriva i poboljšivači zemljišta",
      },
      {
        label: "Mikrobiološka đubriva",
        route: "/podkategorija/Mikrobiološka đubriva",
      },
    ],
  },
  {
    label: "Seme",
    route: "/seme",
    subItems: [
      {
        label: "Seme ratarskih kultura",
        route: "/podkategorija/Seme ratarskih kultura",
      },
      {
        label: "Seme povrtarskih kultura",
        route: "/podkategorija/Seme povrtarskih kultura",
      },
      {
        label: "Sadnice ukrasnog bilja",
        route: "/podkategorija/Sadnice ukrasnog bilja",
      },
      { label: "Sadnice voća", route: "/podkategorija/Sadnice voća" },
    ],
  },
  {
    label: "Pet program",
    route: "/pet-program",
    subItems: [
      {
        label: "Hrana za kućne ljubimce",
        route: "/podkategorija/Hrana za kućne ljubimce",
      },
      {
        label: "Oprema za kućne ljubimce",
        route: "/podkategorija/Oprema za kućne ljubimce",
      },
      {
        label: "Hrana za domaće životinje",
        route: "/podkategorija/Hrana za domaće životinje",
      },
    ],
  },
  {
    label: "Garden program",
    route: "/garden-program",
    subItems: [
      { label: "Mašine", route: "/podkategorija/Mašine" },
      { label: "Alati", route: "/podkategorija/Alati" },
      {
        label: "Oprema za navodnjavanje",
        route: "/podkategorija/Oprema za navodnjavanje",
      },
      { label: "Folije i veziva", route: "/podkategorija/Folije i veziva" },
      {
        label: "Supstrati malčevi i zemlja za cveće",
        route: "/podkategorija/Supstrati malčevi i zemlja za cveće",
      },
      {
        label: "Saksije i žardinjere",
        route: "/podkategorija/Saksije i žardinjere",
      },
      {
        label: "Baštenski nameštaj",
        route: "/podkategorija/Baštenski nameštaj",
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
