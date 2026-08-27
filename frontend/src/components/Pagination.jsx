import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Builds the visible page numbers: always the first and last page, a window
// around the current one, and "…" wherever a stretch is skipped. Short blogs
// (<= 7 pages) just get every number.
function pageItems(page, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const window = [page - 1, page, page + 1].filter(
    (n) => n > 1 && n < pageCount,
  );
  const items = [1, ...window, pageCount];
  const out = [];
  for (const n of items) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && n - prev > 1) out.push(`gap-${n}`);
    out.push(n);
  }
  return out;
}

// Public pager for /recipes. Every page is a real <Link> to ?page=N rather than
// a click handler, so each page is a crawlable URL and the browser's back
// button walks the history the reader expects.
export default function Pagination({ page, pageCount, hrefFor, label = "Pagination" }) {
  if (pageCount <= 1) return null;

  const base =
    "min-w-9 h-9 px-3 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors";

  return (
    <nav aria-label={label} className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link
              to={hrefFor(page - 1)}
              rel="prev"
              aria-label="Previous page"
              className={`${base} gap-1 border border-amber-200 bg-white text-zinc-700 hover:border-orange-300 hover:text-orange-700`}
            >
              <ChevronLeft size={15} /> Prev
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${base} gap-1 border border-amber-100 bg-amber-50/40 text-zinc-300`}
            >
              <ChevronLeft size={15} /> Prev
            </span>
          )}
        </li>

        {pageItems(page, pageCount).map((item) =>
          typeof item === "string" ? (
            <li
              key={item}
              aria-hidden="true"
              className="px-1 text-zinc-400 select-none"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to={hrefFor(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={
                  item === page
                    ? `${base} bg-orange-600 text-white shadow-sm`
                    : `${base} border border-amber-200 bg-white text-zinc-700 hover:border-orange-300 hover:text-orange-700`
                }
              >
                {item}
              </Link>
            </li>
          ),
        )}

        <li>
          {page < pageCount ? (
            <Link
              to={hrefFor(page + 1)}
              rel="next"
              aria-label="Next page"
              className={`${base} gap-1 border border-amber-200 bg-white text-zinc-700 hover:border-orange-300 hover:text-orange-700`}
            >
              Next <ChevronRight size={15} />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${base} gap-1 border border-amber-100 bg-amber-50/40 text-zinc-300`}
            >
              Next <ChevronRight size={15} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
