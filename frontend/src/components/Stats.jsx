import { useEffect, useRef, useState } from "react";

const stats = [
  {
    value: 1,
    suffix: "",
    label: "Clear Instructions",
    sub: "from ingredients to serving",
  },
  {
    value: 2,
    suffix: "",
    label: "Practical Priorities",
    sub: "clarity and usefulness",
  },
  {
    value: 3,
    suffix: "",
    label: "Everyday Goals",
    sub: "cook, store, and reuse",
  },
];

function Counter({ value, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const start = performance.now();
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span
      ref={ref}
      className="text-4xl sm:text-5xl font-bold text-[#448834] font-['Rajdhani']"
    >
      {count}
      {suffix}
    </span>
  );
}

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
            {stats.map(({ value, suffix, label, sub }, i) => (
              <div key={label} className="px-8 py-7 text-center relative">
                {i < stats.length - 1 && (
                  <div className="absolute right-0 top-5 bottom-5 w-px bg-gray-400 hidden sm:block" />
                )}
                <Counter value={value} suffix={suffix} />
                <p className="text-gray-800 font-bold mt-1 text-sm">{label}</p>
                <p className="text-gray-500 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
