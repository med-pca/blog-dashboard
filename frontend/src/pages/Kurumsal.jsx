import {
  CheckCircle,
  Award,
  Wrench,
  HeartHandshake,
  Leaf,
  BarChart3,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { SITE_URL } from "../lib/site";

const values = [
  {
    icon: Award,
    title: "Recipe-Tested Approach",
    desc: "Every published recipe is tested for timing, ingredient clarity, and realistic home-kitchen execution.",
  },
  {
    icon: Wrench,
    title: "Practical Cooking Systems",
    desc: "We build repeatable prep and cooking workflows that help busy people eat better with less stress.",
  },
  {
    icon: Leaf,
    title: "Seasonal Mindset",
    desc: "Our menus and guides prioritize seasonal produce and balanced choices for better flavor and value.",
  },
  {
    icon: BarChart3,
    title: "Budget-Friendly Planning",
    desc: "We focus on affordable ingredient swaps and meal plans that lower cost without lowering quality.",
  },
  {
    icon: HeartHandshake,
    title: "Community-Driven",
    desc: "Reader feedback continuously improves our recipes, tips, and cooking guides.",
  },
  {
    icon: CheckCircle,
    title: "Clear, Honest Instructions",
    desc: "Step-by-step guidance, accurate measurements, and practical notes keep your cooking reliable.",
  },
];

const stats = [
  { value: "100+", label: "Recipe Trials" },
  { value: "25+", label: "Featured Dishes" },
  { value: "4", label: "Main Food Tracks" },
  { value: "$0", label: "Free Access" },
];

const collagePhotos = [
  "/food/illustration-1.svg",
  "/food/illustration-2.svg",
  "/food/illustration-3.svg",
  "/food/illustration-4.svg",
];

export default function Kurumsal() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE_URL}/kurumsal`,
    name: "About | Pulse Recipe",
    description:
      "About Pulse Recipe. A food-first platform sharing practical recipes and cooking guides for everyday life.",
    mainEntity: {
      "@type": "Organization",
      name: "Pulse Recipe",
      url: SITE_URL,
      logo: `${SITE_URL}/food/logo-mark.svg`,
      email: "contact@pulserecipe.com",
    },
  };

  return (
    <>
      <SEO
        title="About"
        description="About Pulse Recipe. A food-first platform sharing practical recipes and cooking guides for everyday life."
        jsonLd={jsonLd}
      />
      <PageHeader title="About" />

      <section className="relative py-20 bg-white overflow-hidden">
        <img
          src="/food/section-bg.svg"
          alt=""
          className="absolute bottom-0 right-0 w-140 opacity-50 pointer-events-none select-none"
          loading="lazy"
        />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative border-2 border-[#448834] rounded-3xl p-3">
            <div className="absolute -top-7 -left-7 z-20">
              <div className="w-24 h-24 rounded-full border-2 border-[#448834] bg-white shadow-lg flex items-center justify-center">
                <img
                  src="/food/logo-mark.svg"
                  alt="Pulse Recipe"
                  className="w-16 h-16"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="flex gap-3 h-80 sm:h-105 lg:h-140">
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-3 overflow-hidden rounded-xl">
                  <img
                    src={collagePhotos[0]}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="flex-2 overflow-hidden rounded-xl">
                  <img
                    src={collagePhotos[1]}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-2 overflow-hidden rounded-xl">
                  <img
                    src={collagePhotos[2]}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="flex-3 overflow-hidden rounded-xl">
                  <img
                    src={collagePhotos[3]}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-4">
              Pulse Recipe
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Practical Recipes For
              <br />
              Real Home Kitchens
            </h2>
            <p className="text-gray-500 leading-relaxed mb-5">
              Pulse Recipe is built for everyday cooks who want reliable
              recipes without complexity. We focus on clear methods, balanced
              meals, and approachable ingredient choices.
            </p>
            <p className="text-gray-500 leading-relaxed mb-10">
              From weekly planning to final plating, our guides are designed to
              reduce stress and increase confidence in the kitchen.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 py-8 border-y border-gray-100">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-[#448834] font-bold text-3xl font-['Rajdhani'] leading-none mb-1">
                    {value}
                  </p>
                  <p className="text-gray-500 text-xs leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">
              Our Values
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Why Pulse Recipe?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map(({ icon, title, desc }) => {
              const Icon = icon;
              return (
                <div
                  key={title}
                  className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-[#448834]/30 hover:shadow-md transition-all"
                >
                  <Icon size={20} className="text-[#448834] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1.5">
                      {title}
                    </h4>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
