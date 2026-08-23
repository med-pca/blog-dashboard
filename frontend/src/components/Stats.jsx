import { ClipboardCheck, ListChecks, ShieldCheck } from "lucide-react";

const stats = [
  {
    icon: ClipboardCheck,
    label: "Reviewed Before Publishing",
    sub: "Every article requires an editorial decision",
  },
  {
    icon: ListChecks,
    label: "Clear Recipe Structure",
    sub: "Ingredients, steps, timing, storage, and useful notes",
  },
  {
    icon: ShieldCheck,
    label: "Safety-Aware Guidance",
    sub: "Responsible wording for cooking, cooling, and reheating",
  },
];

export default function Stats() {
  return (
    <section className="relative z-10 -mt-24 pb-6 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/food/stats-bg.svg"
              alt=""
              className="w-full h-full object-cover opacity-35"
              width="1440"
              height="611"
              loading="lazy"
            />
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3">
            {stats.map(({ icon: Icon, label, sub }, i) => (
              <div key={label} className="px-8 py-7 text-center relative">
                {i < stats.length - 1 && (
                  <div className="absolute right-0 top-5 bottom-5 w-px bg-gray-400 hidden sm:block" />
                )}
                <Icon
                  size={34}
                  strokeWidth={1.8}
                  className="mx-auto text-[#448834]"
                  aria-hidden="true"
                />
                <p className="text-gray-800 font-bold mt-3 text-sm">{label}</p>
                <p className="text-gray-500 text-xs leading-relaxed mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
