import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import Logo from "./Logo";
import { WA_NUMBER, WHATSAPP_ENABLED } from "../lib/whatsapp";

// Google AdSense requires these to be reachable from every page.
const LEGAL_LINKS = [
  { to: "/kvkk", label: "Privacy Policy" },
  { to: "/cookies", label: "Cookie Policy" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/disclaimer", label: "Disclaimer" },
];

export default function Footer() {
  return (
    <footer className="relative bg-black text-gray-400 overflow-hidden">
      <img
        src="/food/section-bg.svg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.15] pointer-events-none select-none"
        loading="lazy"
      />
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4 -ml-3">
              <Logo textWhite className="h-16 w-auto" />
            </div>
            <p className="text-[#f5ce31] font-semibold italic mb-3">
              "From pantry to plate, joy in every bite."
            </p>
            <p className="text-sm leading-relaxed max-w-sm mb-6">
              Pulse Recipe shares approachable recipes, meal-prep ideas, and
              kitchen inspiration for busy home cooks who still want delicious
              food every day.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/renelenerjimuhendislik/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center transition-all hover:opacity-70"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/p/RenEl-Enerji-M%C3%BChendislik-61578891790441/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center transition-all hover:opacity-70"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {WHATSAPP_ENABLED && (
                <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center transition-all hover:opacity-70"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.845L.057 23.454a.75.75 0 00.918.919l5.702-1.44A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0m0 21.9a9.865 9.865 0 01-5.031-1.376l-.36-.214-3.733.943.991-3.627-.235-.374A9.862 9.862 0 012.1 12C2.1 6.533 6.533 2.1 12 2.1S21.9 6.533 21.9 12 17.467 21.9 12 21.9" />
                </svg>
              </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-white font-bold mb-4">Pages</p>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/hizmetler"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  Recipes
                </Link>
              </li>
              <li>
                <Link
                  to="/projelerimiz"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  to="/kurumsal"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/referanslar"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  Community
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/tasarruf-hesaplayici"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  Budget Planner
                </Link>
              </li>
              <li>
                <Link
                  to="/sss"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/iletisim"
                  className="text-sm hover:text-[#f5ce31] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-bold mb-4">Contact</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-[#f5ce31] shrink-0 mt-0.5" />
                <span className="text-sm">
                  Kurtulus, Inkilap St. no:4 D:J, 45500 Soma/Manisa
                </span>
              </li>
              {WHATSAPP_ENABLED && (
                <li>
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-[#f5ce31] transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="#f5ce31"
                    className="shrink-0"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                  +1 706 575 89 55
                </a>
              </li>
              )}
              <li>
                <a
                  href="mailto:contact@pulserecipe.com"
                  className="flex items-center gap-3 text-sm hover:text-[#f5ce31] transition-colors"
                >
                  <Mail size={15} className="text-[#f5ce31] shrink-0" />
                  contact@pulserecipe.com
                </a>
              </li>
            </ul>

            <div className="mt-6">
              <p className="text-[#f5ce31] font-semibold text-sm mb-1">
                Editorial Kitchen Team
              </p>
              <p className="text-xs">Recipe Testing & Food Writing</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-xs space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="hover:text-[#f5ce31] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p>
              © {new Date().getFullYear()} Pulse Recipe. All rights reserved.
            </p>
            <p>
              Design & Development{" "}
              <a
                href="https://www.linkedin.com/in/m-lyazidi/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f5ce31] hover:text-[#448834] transition-colors"
              >
                Mohamed Lyazidi
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
