import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function PageHeader({ title, parent }) {
  return (
    <div className="relative h-40 flex items-center overflow-hidden">
      <img
        src="/food/header-bg.svg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative max-w-7xl mx-auto px-6 w-full flex items-center justify-between gap-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
          {title}
        </h1>
        <nav className="hidden sm:flex items-center gap-1.5 text-sm shrink-0">
          <Link
            to="/"
            className="text-white/60 hover:text-white transition-colors whitespace-nowrap"
          >
            Home
          </Link>
          {parent && (
            <>
              <ChevronRight size={14} className="text-white/40" />
              <Link
                to={parent.to}
                className="text-white/60 hover:text-white transition-colors whitespace-nowrap"
              >
                {parent.label}
              </Link>
            </>
          )}
          <ChevronRight size={14} className="text-white/40" />
          <span className="text-[#f5ce31] font-semibold max-w-50 truncate">
            {title}
          </span>
        </nav>
      </div>
    </div>
  );
}
