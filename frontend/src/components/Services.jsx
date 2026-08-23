import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChefHat,
  CookingPot,
  PiggyBank,
  Sparkles,
  Timer,
  Utensils,
  Wrench,
} from "lucide-react";

// Titles, slugs and grouping mirror pages/hizmetler/HizmetDetay.jsx and the
// Navbar dropdown — the three must not drift apart again.
const categories = [
  {
    id: "cooking",
    label: "Cooking",
    labelShort: "Cooking",
    description:
      "Practical cooking guides for real weeknights — what to make when time is short, and why dishes go wrong when they do.",
    services: [
      {
        icon: CookingPot,
        title: "Weeknight Dinners",
        slug: "weeknight-dinners",
        description:
          "Real dinners on a weeknight, built around one pan and ingredients matched by cooking time.",
        features: [
          "One pan or one tray",
          "Under forty-five minutes",
          "A rotation that removes the decision",
        ],
        photo: "/guides/home-kitchen-systems.webp",
        photoAlt: "Organized home kitchen workflow with prepared ingredients",
        highlight: true,
      },
      {
        icon: Timer,
        title: "Fast 30-Minute Meals",
        slug: "30-minute-meals",
        description:
          "Thirty minutes start to plate, by removing dead time rather than turning the heat up.",
        features: [
          "Heat first, chop second",
          "Cuts that finish in the time you have",
          "Pantry depth without the simmering",
        ],
        photo: "/guides/fast-weeknight-cooking.webp",
        photoAlt: "Fast one-pan weeknight dinner preparation with a timer",
        ring: "ring-2 ring-[#448834]/30",
      },
      {
        icon: Sparkles,
        title: "Core Cooking Techniques",
        slug: "cooking-techniques",
        description:
          "Seasoning, browning, heat control and knife work — the ideas underneath almost every recipe.",
        features: [
          "Salt early, taste often",
          "Dry surface, hot pan, space",
          "Even cuts before fast cuts",
        ],
        photo: "/guides/cooking-coaching.webp",
        photoAlt: "Home cook practicing seasoning and technique with a notebook",
        ring: "ring-2 ring-[#448834]/30",
      },
      {
        icon: Wrench,
        title: "Fixing Common Cooking Mistakes",
        slug: "cooking-mistakes",
        description:
          "Too salty, too bland, watery or burnt — what actually caused it and what still saves it.",
        features: [
          "Bland usually means missing acid",
          "Dilution, not potatoes",
          "Reduce a weak sauce, thicken a strong one",
        ],
        photo: "/guides/recipe-troubleshooting.webp",
        photoAlt: "Cook reviewing recipe notes while adjusting a sauce",
        ring: "ring-2 ring-[#448834]/30",
      },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    labelShort: "Planning",
    description:
      "Plan a week that survives contact with the week — menus with slack, batch cooking that stays interesting, and a smaller grocery bill.",
    services: [
      {
        icon: CalendarDays,
        title: "Weekly Menu Planning",
        slug: "menu-planning",
        description:
          "Plan four dinners rather than seven, ordered by what spoils first.",
        features: [
          "One night deliberately left open",
          "Ingredients chosen to overlap",
          "A pantry meal held in reserve",
        ],
        photo: "/guides/menu-planning.webp",
        photoAlt: "Weekly menu planning board surrounded by fresh meals",
        highlight: true,
      },
      {
        icon: ChefHat,
        title: "Meal Prep & Batch Cooking",
        slug: "meal-prep",
        description:
          "Prepare components instead of finished meals, and assemble them differently each night.",
        features: [
          "One grain, one protein",
          "Dressings kept separate",
          "Frozen in single portions",
        ],
        photo: "/guides/meal-prep-planning.webp",
        photoAlt: "Weekly meal prep plan with organized balanced meals",
        ring: "ring-2 ring-[#448834]/30",
      },
      {
        icon: PiggyBank,
        title: "Budget Cooking",
        slug: "budget-cooking",
        description:
          "Spend less without eating worse — cheap protein, pantry umami, and far less waste.",
        features: [
          "Cheap protein as the starting point",
          "Whole vegetables over pre-cut",
          "Waste as the biggest single saving",
        ],
        photo: "/guides/budget-cooking.webp",
        photoAlt: "Affordable pantry staples and a balanced homemade meal",
        ring: "ring-2 ring-[#448834]/30",
      },
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen",
    labelShort: "Kitchen",
    description:
      "The short list of equipment that changes how you cook, and how to arrange it so the kitchen stops getting in the way.",
    services: [
      {
        icon: Utensils,
        title: "Kitchen Setup & Gear",
        slug: "kitchen-setup",
        description:
          "One sharp knife, one heavy pan, a set of scales — and why the gadgets can wait.",
        features: [
          "Sharpness over price",
          "Heavy pans hold their heat",
          "Scales make baking repeatable",
        ],
        photo: "/guides/kitchen-gear.webp",
        photoAlt: "Essential cookware and utensils in a warm home kitchen",
        highlight: true,
      },
    ],
  },
];

export default function Services() {
  const [activeTab, setActiveTab] = useState("cooking");

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
                      to={`/guides/${s.slug}`}
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
                      <Link to={`/guides/${s.slug}`} className="contents">
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
                          to={`/guides/${s.slug}`}
                          aria-label={`View details for ${s.title}`}
                          className="text-sm font-semibold text-gray-500 hover:text-[#448834] transition-colors"
                        >
                          View Details
                        </Link>
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
