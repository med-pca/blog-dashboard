import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import Logo from "./Logo";

const hizmetlerDropdown = [
  {
    category: "By Meal Type",
    items: [
      { label: "Quick Breakfasts", to: "/hizmetler/sulama" },
      { label: "Weeknight Dinners", to: "/hizmetler/cati-arazi" },
      { label: "Comfort Food Classics", to: "/hizmetler/bag-evi" },
      { label: "Healthy Bowls", to: "/hizmetler/ev-sarj" },
    ],
  },
  {
    category: "By Preference",
    items: [
      { label: "Vegetarian Favorites", to: "/hizmetler/ges-bakim-onarim" },
      { label: "High Protein Ideas", to: "/hizmetler/elektrik-altyapi-bakimi" },
    ],
  },
  {
    category: "Guides",
    items: [
      { label: "Meal Prep Basics", to: "/hizmetler/proje-danismanlik" },
      { label: "Kitchen Tips & Tricks", to: "/hizmetler/enerji-danismanlik" },
    ],
  },
];

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/kurumsal" },
  { label: "Recipes", to: "/hizmetler", dropdown: hizmetlerDropdown },
  { label: "Collections", to: "/projelerimiz" },
  { label: "Community", to: "/referanslar" },
  { label: "Blog", to: "/blog" },
  { label: "FAQ", to: "/sss" },
  { label: "Contact", to: "/iletisim" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileHizmetlerOpen, setMobileHizmetlerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !open;
  const dropdownRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileHizmetlerOpen(false);
  }, [pathname]);

  function openDropdown() {
    clearTimeout(closeTimer.current);
    setDropdownOpen(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 120);
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-500 ${transparent ? "bg-transparent" : "bg-white shadow-lg"}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-24 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center select-none"
            aria-label="Pulse Recipe Home"
          >
            <Logo textWhite={transparent} className="h-16 w-auto" />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map((l) => {
              if (!l.dropdown) {
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) =>
                      `font-medium text-base transition-colors relative group ${
                        transparent
                          ? isActive
                            ? "text-[#448834] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                            : "text-white hover:text-[#448834] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                          : isActive
                            ? "text-[#448834]"
                            : "text-gray-700 hover:text-[#448834]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {l.label}
                        <span
                          className={`absolute -bottom-1 left-0 h-0.5 bg-[#448834] transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}
                        />
                      </>
                    )}
                  </NavLink>
                );
              }

              // Dropdown item
              const isHizmetlerActive = pathname.startsWith("/hizmetler");
              return (
                <div
                  key={l.to}
                  ref={dropdownRef}
                  className="relative"
                  onMouseEnter={openDropdown}
                  onMouseLeave={scheduleClose}
                >
                  <NavLink
                    to={l.to}
                    className={`font-medium text-base transition-colors relative group inline-flex items-center gap-1 ${
                      transparent
                        ? isHizmetlerActive
                          ? "text-[#448834] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                          : "text-white hover:text-[#448834] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                        : isHizmetlerActive
                          ? "text-[#448834]"
                          : "text-gray-700 hover:text-[#448834]"
                    }`}
                  >
                    {l.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-[#448834] transition-all duration-300 ${isHizmetlerActive ? "w-full" : "w-0 group-hover:w-full"}`}
                    />
                  </NavLink>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-56 z-50"
                      onMouseEnter={openDropdown}
                      onMouseLeave={scheduleClose}
                    >
                      {/* Arrow */}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />

                      <div className="flex gap-6">
                        {l.dropdown.map((group) => (
                          <div key={group.category}>
                            <p className="text-[10px] font-bold text-[#448834] uppercase tracking-widest mb-2 px-1">
                              {group.category}
                            </p>
                            <ul className="space-y-0.5">
                              {group.items.map((item) => (
                                <li key={item.to}>
                                  <Link
                                    to={item.to}
                                    onClick={() => setDropdownOpen(false)}
                                    className={`block px-2 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                                      pathname === item.to
                                        ? "bg-[#448834]/10 text-[#448834] font-semibold"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-[#448834]"
                                    }`}
                                  >
                                    {item.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              className={`lg:hidden p-2 transition-colors ${transparent ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" : "text-gray-700"}`}
              onClick={() => {
                setOpen((o) => !o);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-label="Menu"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-1 shadow-lg">
            {navLinks.map((l) => {
              if (!l.dropdown) {
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `font-medium py-2 border-b border-gray-100 transition-colors ${isActive ? "text-[#448834]" : "text-gray-700 hover:text-[#448834]"}`
                    }
                  >
                    {l.label}
                  </NavLink>
                );
              }

              const isHizmetlerActive = pathname.startsWith("/hizmetler");
              return (
                <div key={l.to} className="border-b border-gray-100">
                  <button
                    onClick={() => setMobileHizmetlerOpen((o) => !o)}
                    className={`w-full flex items-center justify-between font-medium py-2 transition-colors ${isHizmetlerActive ? "text-[#448834]" : "text-gray-700"}`}
                  >
                    {l.label}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${mobileHizmetlerOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {mobileHizmetlerOpen && (
                    <div className="pb-2 pl-3 flex flex-col gap-3">
                      <Link
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className="text-sm text-gray-500 hover:text-[#448834] transition-colors"
                      >
                        All Recipes →
                      </Link>
                      {l.dropdown.map((group) => (
                        <div key={group.category}>
                          <p className="text-[10px] font-bold text-[#448834] uppercase tracking-widest mb-1.5">
                            {group.category}
                          </p>
                          <ul className="space-y-1">
                            {group.items.map((item) => (
                              <li key={item.to}>
                                <Link
                                  to={item.to}
                                  onClick={() => setOpen(false)}
                                  className={`block text-sm py-0.5 transition-colors ${
                                    pathname === item.to
                                      ? "text-[#448834] font-semibold"
                                      : "text-gray-600 hover:text-[#448834]"
                                  }`}
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
}
