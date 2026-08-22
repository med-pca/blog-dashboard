import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
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
