import { Link } from "react-router-dom";
import { ArrowRight, CookingPot, TrendingUp } from "lucide-react";
import { useState } from "react";
import { TARIFFS, calculateGes, parseBillInput } from "../lib/gesCalc";

export default function Hero() {
  const [bill, setBill] = useState("");
  const [tariff, setTariff] = useState("mesken");

  const result = calculateGes(Number(bill), tariff);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-24">
      {/* Background image */}
      <div className="absolute inset-0 bg-gray-900">
        <img
          src="/hero.webp"
          srcSet="/hero-640w.webp 640w, /hero-1024w.webp 1024w, /hero-1600w.webp 1600w, /hero.webp 1672w"
          sizes="100vw"
          alt="Fresh food prep"
          className="w-full h-full object-cover"
          width="1672"
          height="941"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/25 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 pt-25 sm:pt-33 lg:pt-41 pb-24 w-full flex items-center justify-between gap-8 xl:gap-12">
        {/* Left — text */}
        <div className="w-full max-w-xl min-w-0">
          <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-7xl font-bold text-white leading-[1.05] mb-5 sm:mb-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            Cook Better,
            <br />
            <span className="text-[#f5ce31]">Eat Happier,</span>
            <br />
            Every Day
            <br />
            <span className="text-[#f5ce31]">At Home.</span>
          </h1>

          <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            Discover easy recipes, quick kitchen wins, and smart meal planning
            ideas that fit your schedule without sacrificing flavor.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/projelerimiz"
              className="inline-flex items-center gap-2 bg-[#3d7a2e] hover:bg-[#357228] text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl transition-colors shadow-lg shadow-black/30"
            >
              Explore Collections
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/tasarruf-hesaplayici"
              className="lg:hidden inline-flex items-center gap-2 bg-[#f5ce31] hover:bg-[#e0ba24] text-gray-900 font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl transition-colors shadow-lg shadow-black/30"
            >
              Budget Planner
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        {/* Right — mini savings calculator */}
        <div className="hidden lg:block shrink-0 w-90 xl:w-115 border-2 border-[#f5ce31]/60 rounded-[2rem] p-2">
          <div className="bg-white rounded-3xl p-7 shadow-xl shadow-black/30">
            <p className="text-gray-900 font-bold text-lg mb-1">
              Kitchen Budget Planner
            </p>
            <p className="text-gray-500 text-sm mb-5">
              Enter your monthly food budget to get a quick plan.
            </p>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Cooking Style
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {TARIFFS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTariff(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tariff === t.id
                      ? "bg-[#448834] text-white"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#448834]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative mb-5">
              <input
                type="text"
                inputMode="numeric"
                value={bill ? Number(bill).toLocaleString("en-US") : ""}
                onChange={(e) => setBill(parseBillInput(e.target.value))}
                placeholder="Your monthly budget"
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-[#448834] text-gray-800 placeholder-gray-400 focus:outline-none transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
            </div>

            {result ? (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <CookingPot size={22} className="text-[#448834] mb-2" />
                  <p className="text-gray-900 font-bold text-2xl font-['Rajdhani'] leading-tight">
                    {result.systemKwp}
                  </p>
                  <p className="text-gray-500 text-xs">Weekly Cook Sessions</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <TrendingUp size={22} className="text-[#448834] mb-2" />
                  <p className="text-gray-900 font-bold text-2xl font-['Rajdhani'] leading-tight">
                    {result.annualSavings.toLocaleString("en-US")} USD
                  </p>
                  <p className="text-gray-500 text-xs">
                    Estimated Yearly Savings
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6 mb-5">
                Your plan preview appears here after entering a budget.
              </p>
            )}

            <Link
              to={
                bill
                  ? `/tasarruf-hesaplayici?fatura=${encodeURIComponent(bill)}&tarife=${tariff}`
                  : "/tasarruf-hesaplayici"
              }
              className="w-full flex items-center justify-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-base py-3.5 rounded-xl transition-colors"
            >
              View Detailed Plan
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none h-20">
        <svg
          className="absolute bottom-0 w-[200%] h-full animate-[wave_8s_linear_infinite]"
          viewBox="0 0 2880 80"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 C1680,80 1920,0 2160,40 C2400,80 2640,0 2880,40 L2880,80 L0,80 Z"
            fill="white"
            fillOpacity="0.4"
          />
        </svg>
        <svg
          className="absolute bottom-0 w-[200%] h-full animate-[wave_5s_linear_infinite]"
          viewBox="0 0 2880 80"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,55 C240,20 480,70 720,45 C960,20 1200,70 1440,45 C1680,20 1920,70 2160,45 C2400,20 2640,70 2880,45 L2880,80 L0,80 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
