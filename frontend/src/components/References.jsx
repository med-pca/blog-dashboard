import { useEffect, useState } from "react";
import { fetchReferences } from "../api/references";
import { API } from "../api/config.js";
import { ReferencesSkeleton } from "./Skeletons";
import LoadError from "./LoadError";

export default function References() {
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    fetchReferences()
      .then(setRefs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (!loading && !error && refs.length === 0) return null;

  return (
    <section id="referanslar" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-4">
            COMMUNITY LOVES
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f2744] mb-4">
            Readers Who Cook With Us
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Home cooks and partners who follow our recipes and kitchen guides.
          </p>
        </div>

        {loading ? (
          <ReferencesSkeleton />
        ) : error ? (
          <LoadError
            message="Could not load community references. Please check your connection and try again."
            onRetry={load}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {refs.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-[#448834]/20 transition-all duration-200 p-5 flex flex-col items-center gap-3"
              >
                <div className="w-full h-44 flex items-center justify-center">
                  {r.logo ? (
                    <img
                      src={`${API}${r.logo}`}
                      alt={r.name}
                      className="max-h-40 max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#448834]/10 flex items-center justify-center">
                      <span className="text-[#448834] font-bold text-lg">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-700 text-center leading-tight">
                  {r.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
