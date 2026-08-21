import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Croissant,
  CookingPot,
  Soup,
  Salad,
  ChefHat,
  Timer,
  CalendarDays,
  PiggyBank,
  ArrowRight,
} from "lucide-react";
import { waLink } from "../lib/whatsapp";

const categories = [
  {
    id: "ges",
    label: "Recipe Categories",
    labelShort: "Recipes",
    description:
      "From quick breakfasts to cozy dinners, discover practical recipes that fit real schedules and home kitchens.",
    services: [
      {
        icon: Croissant,
        title: "Quick Breakfast Recipes",
        slug: "sulama",
        description:
          "Fast, tasty ideas for busy mornings with simple ingredients and minimal prep.",
        features: [
          "15-minute ideas",
          "Pantry-friendly ingredients",
          "Beginner-friendly steps",
        ],
        photo: "/food/illustration-1.svg",
        ring: "ring-2 ring-[#448834]/30",
        waMessage:
          "Hi, I would like recipe suggestions for quick breakfast meals.",
      },
      {
        icon: CookingPot,
        title: "Weeknight Dinner Favorites",
        slug: "cati-arazi",
        description:
          "Reliable main dishes for weekdays when you need comfort and speed together.",
        features: [
          "One-pan dinners",
          "Family-friendly flavors",
          "Balanced everyday meals",
        ],
        photo: "/food/illustration-2.svg",
        highlight: true,
        waMessage: "Hi, I would like easy weeknight dinner recommendations.",
      },
      {
        icon: Soup,
        title: "Comfort Food Classics",
        slug: "bag-evi",
        description:
          "Hearty dishes and nostalgic flavors for weekends, gatherings, and cozy evenings.",
        features: [
          "Slow-cooked favorites",
          "Seasonal twists",
          "Crowd-pleasing portions",
        ],
        photo: "/food/illustration-3.svg",
        ring: "ring-2 ring-[#448834]/30",
        waMessage: "Hi, I would like comfort food recipe recommendations.",
      },
      {
        icon: Salad,
        title: "Healthy Bowl Ideas",
        slug: "ev-sarj",
        description:
          "Fresh bowls packed with grains, vegetables, and proteins for energizing daily meals.",
        features: [
          "Protein-rich combinations",
          "Meal prep friendly",
          "Colorful seasonal produce",
        ],
        photo: "/food/illustration-4.svg",
        ring: "ring-2 ring-[#448834]/30",
        waMessage: "Hi, I would like healthy bowl recipe ideas for meal prep.",
      },
    ],
  },
  {
    id: "bakim",
    label: "Kitchen Skills",
    labelShort: "Skills",
    description:
      "Master the basics with practical cooking techniques that improve flavor, speed, and confidence in the kitchen.",
    services: [
      {
        icon: ChefHat,
        title: "Meal Prep Foundations",
        slug: "ges-bakim-onarim",
        description:
          "Learn smart prep workflows to save time and keep meals ready all week.",
        features: [
          "Batch cooking workflow",
          "Storage best practices",
          "Weekly prep templates",
        ],
        photo: "/food/illustration-1.svg",
        ring: "ring-2 ring-[#448834]/30",
        waMessage: "Hi, I want help with meal prep basics and weekly planning.",
      },
      {
        icon: Timer,
        title: "Kitchen Efficiency Tips",
        slug: "elektrik-altyapi-bakimi",
        description:
          "Simple habits and tool choices that speed up cooking and reduce kitchen stress.",
        features: [
          "Knife and prep shortcuts",
          "Time-saving kitchen setup",
          "Waste-reduction habits",
        ],
        photo: "/food/illustration-2.svg",
        ring: "ring-2 ring-[#448834]/30",
        waMessage:
          "Hi, I want kitchen efficiency tips for faster daily cooking.",
      },
    ],
  },
  {
    id: "danismanlik",
    label: "Food Guides",
    labelShort: "Guides",
    description:
      "Follow practical food guides for budgeting, balanced planning, and choosing ingredients with confidence.",
    services: [
      {
        icon: CalendarDays,
        title: "Meal Planning Guide",
        slug: "proje-danismanlik",
        description:
          "Build practical weekly meal plans with less decision fatigue and better nutrition balance.",
        features: [
          "Weekly menu templates",
          "Balanced plate method",
          "Shopping rhythm tips",
        ],
        photo: "/food/illustration-3.svg",
        highlight: true,
        waMessage:
          "Hi, I would like support building an easy weekly meal plan.",
      },
      {
        icon: PiggyBank,
        title: "Budget Cooking Guide",
        slug: "enerji-danismanlik",
        description:
          "Learn how to shop smarter, reduce food waste, and cook satisfying meals on budget.",
        features: [
          "Cost-per-meal planning",
          "Smart substitutions",
          "Leftover transformation ideas",
        ],
        photo: "/food/illustration-4.svg",
        photoAlt: "Cook reviewing grocery notes and meal cost plan",
        ring: "ring-2 ring-[#448834]/30",
        waMessage: "Hi, I want budget-friendly recipe and shopping advice.",
      },
    ],
  },
];

export default function Services() {
  const [activeTab, setActiveTab] = useState("ges");

  return (
    <section
      id="hizmetler"
      className="relative py-24 bg-gradient-to-b from-white to-amber-50/40 overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute left-0 bottom-0 w-187.5 h-187.5 pointer-events-none select-none opacity-70">
        <img
          src="/food/illustration-2.svg"
          alt=""
          width="639"
          height="565"
          className="w-full h-full object-contain object-bottom-left"
          loading="lazy"
        />
      </div>

      <div className="max-w-350 mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-orange-700 font-semibold text-base mb-4">
            RECIPE HUB
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Cooking Ideas For Every Day
          </h2>
          <p className="text-zinc-600 max-w-2xl mx-auto text-lg">
            Explore recipes, practical skills, and food guides curated for real
            home kitchens.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === cat.id
                  ? "bg-[#448834] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="sm:hidden">{cat.labelShort}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* All category content in DOM for SEO */}
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={activeTab === cat.id ? "block" : "hidden"}
            aria-hidden={activeTab !== cat.id}
          >
            {/* Cards */}
            <div
              className={`grid gap-6 ${
                cat.services.length === 1
                  ? "max-w-md mx-auto"
                  : cat.services.length === 2
                    ? "sm:grid-cols-2 max-w-2xl mx-auto"
                    : "sm:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {cat.services.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.title}
                    className={`relative rounded-2xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${s.highlight ? "ring-2 ring-[#448834]/30" : s.ring || ""}`}
                  >
                    {/* Photo */}
                    <Link
                      to={`/hizmetler/${s.slug}`}
                      className="block h-36 overflow-hidden"
                    >
                      <img
                        src={s.photo}
                        alt={s.photoAlt ?? s.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </Link>

                    <div className="p-5 flex flex-col gap-3 flex-1 bg-white">
                      <Link to={`/hizmetler/${s.slug}`} className="contents">
                        <div className="flex items-center gap-3">
                          <Icon className="text-[#448834]" size={22} />
                          <div className="h-0.5 flex-1 rounded-full bg-[#448834]/30" />
                        </div>

                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                          {s.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed flex-1">
                          {s.description}
                        </p>

                        <ul className="space-y-1.5">
                          {s.features.map((f) => (
                            <li
                              key={f}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#448834] shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </Link>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Link
                          to={`/hizmetler/${s.slug}`}
                          aria-label={`View details for ${s.title}`}
                          className="text-sm font-semibold text-gray-500 hover:text-[#448834] transition-colors"
                        >
                          View Details
                        </Link>
                        <a
                          href={waLink(s.waMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Get help for ${s.title}`}
                          className="inline-flex items-center gap-1.5 text-[#357228] font-semibold text-sm group-hover:gap-3 transition-all"
                        >
                          Ask For Tips
                          <ArrowRight size={15} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SEO description */}
            <p className="mt-8 text-center text-gray-500 text-sm leading-relaxed max-w-3xl mx-auto">
              {cat.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
