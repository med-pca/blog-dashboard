import { useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  ChefHat,
  CookingPot,
  PiggyBank,
  Utensils,
  Wrench,
  Timer,
  CalendarDays,
  Sparkles,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SEO from "../../components/SEO";
import AdSenseBlock from "../../components/AdSenseBlock";
import { waLink, WHATSAPP_ENABLED } from "../../lib/whatsapp";
import { SITE_URL } from "../../lib/site";

const services = [
  {
    slug: "sulama",
    icon: ChefHat,
    title: "Smart Meal Prep Planning",
    photo: "/guides/meal-prep-planning.webp",
    photoAlt: "Weekly meal prep plan with organized balanced meals and a shopping list",
    subtitle: "Plan your weekly meals with less waste and more consistency.",
    description:
      "Meal prep can save both time and budget when done with a clear structure. We help you organize ingredient flow, prep order, and storage so your week becomes easier.",
    description2:
      "Each plan is designed around practical routines, helping you cook in batches and keep meals balanced across the week.",
    features: [
      "Batch prep planning and sequencing",
      "Reusable base ingredients for multiple meals",
      "Storage-first workflow to reduce waste",
      "Balanced protein, carb, and vegetable planning",
      "Simple reheating and serving strategy",
      "Flexible plan structure for busy days",
    ],
    waMessage:
      "Hi, I would like help with smart meal prep planning for my week.",
  },
  {
    slug: "cati-arazi",
    icon: CookingPot,
    title: "Home Kitchen Recipe Systems",
    photo: "/guides/home-kitchen-systems.webp",
    photoAlt: "Organized home kitchen workflow with prepared ingredients and a simmering pot",
    subtitle:
      "Build a repeatable home-cooking system that actually fits your routine.",
    description:
      "From weeknight dinners to family menus, we design practical recipe systems that are easy to repeat and adapt. You get clear steps and fewer kitchen bottlenecks.",
    description2:
      "Our method focuses on consistency, speed, and flavor so your everyday cooking becomes simpler and more enjoyable.",
    features: [
      "Weekly recipe rotation templates",
      "Beginner-friendly method breakdowns",
      "Family-size and small-batch options",
      "Low-equipment alternatives",
      "Seasonal ingredient substitutions",
      "Long-term routine building",
    ],
    waMessage:
      "Hi, I want a practical home kitchen recipe system for my schedule.",
  },
  {
    slug: "bag-evi",
    icon: PiggyBank,
    title: "Low-Budget Cooking Strategies",
    photo: "/guides/budget-cooking.webp",
    photoAlt: "Affordable pantry staples and a balanced budget-friendly homemade meal",
    subtitle: "Cook better on a budget without giving up flavor or variety.",
    description:
      "Budget cooking works best with smart planning and ingredient overlap. We guide you to choose high-value staples and build multiple meals from the same base.",
    description2:
      "You will learn how to stretch ingredients efficiently while still serving balanced, satisfying dishes.",
    features: [
      "Cost-aware ingredient planning",
      "Staple-first shopping lists",
      "Multi-use ingredients across recipes",
      "Affordable protein alternatives",
      "Leftover transformation ideas",
      "Monthly budget optimization tips",
    ],
    waMessage:
      "Hi, I want budget-friendly cooking strategies and recipe ideas.",
  },
  {
    slug: "ev-sarj",
    icon: Utensils,
    title: "Kitchen Gear and Setup Guidance",
    photo: "/guides/kitchen-gear.webp",
    photoAlt: "Essential durable cookware and utensils arranged in a warm home kitchen",
    subtitle: "Choose tools that improve results instead of adding clutter.",
    description:
      "Not every kitchen needs expensive equipment. We help you pick tools that meaningfully improve speed, texture, and consistency for daily cooking.",
    description2:
      "Our recommendations prioritize practical usage, durability, and real value for home cooks.",
    features: [
      "Essential starter tool list",
      "Budget vs premium buying guidance",
      "Tool use by recipe type",
      "Maintenance and care basics",
      "Small-space kitchen setups",
      "Upgrade path as your skills grow",
    ],
    waMessage: "Hi, I need kitchen gear recommendations for my cooking goals.",
  },
  {
    slug: "ges-bakim-onarim",
    icon: Wrench,
    title: "Recipe Troubleshooting Support",
    photoAlt: "Cook reviewing recipe notes in a home kitchen",
    photo: "/guides/recipe-troubleshooting.webp",
    subtitle: "Fix texture, timing, and flavor issues with practical guidance.",
    description:
      "When recipes fail, small adjustments make a big difference. We help identify root causes such as heat control, moisture balance, and timing order.",
    description2:
      "You get direct correction strategies that are easy to apply immediately in your next cook.",
    features: [
      "Texture correction techniques",
      "Heat and timing adjustment rules",
      "Flavor balancing framework",
      "Common mistake diagnostics",
      "Substitution impact guidance",
      "Step-by-step rescue methods",
    ],
    waMessage: "Hi, I need help troubleshooting issues in my recipes.",
  },
  {
    slug: "elektrik-altyapi-bakimi",
    icon: Timer,
    title: "Fast Weeknight Cooking",
    photoAlt: "Fast dinner preparation workflow in a modern kitchen",
    photo: "/guides/fast-weeknight-cooking.webp",
    subtitle: "Cook complete meals faster with better workflow design.",
    description:
      "Weeknight cooking becomes easier when prep and heat steps are optimized. We show you how to shorten active time while keeping strong flavor.",
    description2:
      "From one-pan options to parallel prep flow, each method is built for limited time without sacrificing quality.",
    features: [
      "20 to 40 minute dinner structures",
      "One-pan and low-mess recipes",
      "Parallel prep timing strategies",
      "Shortcut ingredient planning",
      "Rapid flavor layering methods",
      "Post-cook cleanup minimization",
    ],
    waMessage: "Hi, I want faster weeknight meal methods and recipe ideas.",
  },
  {
    slug: "proje-danismanlik",
    icon: CalendarDays,
    title: "Menu Planning Consulting",
    photoAlt: "Weekly menu planning board with recipe notes",
    photo: "/guides/menu-planning.webp",
    subtitle: "Plan weekly menus with confidence and less decision fatigue.",
    description:
      "A clear menu system removes daily guesswork and improves grocery efficiency. We help you define patterns that match your household rhythm.",
    description2:
      "You get a practical framework for weekdays, weekends, leftovers, and flexible swap options.",
    features: [
      "Weekly menu architecture templates",
      "Shopping list by meal sequence",
      "Balanced macro distribution tips",
      "Seasonal menu adaptation",
      "Family preference mapping",
      "Low-friction repeat systems",
    ],
    waMessage: "Hi, I would like consulting support for weekly menu planning.",
  },
  {
    slug: "enerji-danismanlik",
    icon: Sparkles,
    title: "Cooking Performance Coaching",
    photoAlt: "Home cook tracking recipe outcomes and improvements",
    photo: "/guides/cooking-coaching.webp",
    subtitle: "Improve cooking quality with focused technique coaching.",
    description:
      "Consistent cooking comes from small repeatable habits. We guide you through practical improvements in prep, seasoning, and timing control.",
    description2:
      "With a performance mindset, your meals become more reliable and your confidence grows week by week.",
    features: [
      "Technique-by-technique improvement paths",
      "Flavor calibration routines",
      "Consistency tracking methods",
      "Progress checkpoints by skill level",
      "Custom guidance for your kitchen context",
      "Actionable feedback loops",
    ],
    waMessage:
      "Hi, I want coaching to improve my cooking consistency and technique.",
  },
];

export default function HizmetDetay() {
  const { slug } = useParams();
  const service = services.find((s) => s.slug === slug);

  const activeChipRef = useRef(null);
  const chipContainerRef = useRef(null);

  useEffect(() => {
    const container = chipContainerRef.current;
    const chip = activeChipRef.current;
    if (!container || !chip) return;
    container.scrollLeft =
      chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
  }, [slug]);

  if (!service) return <Navigate to="/hizmetler" replace />;

  const Icon = service.icon;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    image: `${SITE_URL}${service.photo}`,
    url: `${SITE_URL}/hizmetler/${service.slug}`,
    provider: {
      "@type": "Organization",
      name: "Pulse Recipe",
      url: SITE_URL,
    },
    areaServed: { "@type": "Place", name: "Global" },
  };

  return (
    <>
      <SEO
        title={service.title}
        description={`${service.subtitle} ${service.description}`.slice(0, 160)}
        image={`${SITE_URL}${service.photo}`}
        jsonLd={jsonLd}
      />
      <PageHeader
        title={service.title}
        parent={{ to: "/hizmetler", label: "Guides" }}
      />

      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-24 z-40">
        <div
          ref={chipContainerRef}
          className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none"
        >
          {services.map((s) => {
            const SIcon = s.icon;
            const active = s.slug === slug;
            return (
              <Link
                key={s.slug}
                ref={active ? activeChipRef : null}
                to={`/hizmetler/${s.slug}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? "bg-[#448834] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <SIcon size={12} />
                {s.title}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="py-8 lg:py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-7 items-start">
            <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#448834] px-5 py-4">
                  <p className="text-white font-bold text-sm">Our Guides</p>
                </div>
                <nav className="divide-y divide-gray-50">
                  {services.map((s) => {
                    const SIcon = s.icon;
                    const active = s.slug === slug;
                    return (
                      <Link
                        key={s.slug}
                        to={`/hizmetler/${s.slug}`}
                        className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors group ${
                          active
                            ? "bg-[#448834]/8 text-[#448834] font-semibold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#448834]"
                        }`}
                      >
                        <SIcon
                          size={15}
                          className={
                            active
                              ? "text-[#448834]"
                              : "text-gray-400 group-hover:text-[#448834]"
                          }
                        />
                        <span className="flex-1 leading-snug">{s.title}</span>
                        {active && (
                          <ChevronRight size={13} className="text-[#448834]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-4 bg-[#448834] rounded-2xl p-5 text-center">
                <p className="text-white font-bold text-sm mb-1">
                  Need Personalized Help?
                </p>
                <p className="text-white/75 text-xs mb-4 leading-relaxed">
                  Tell us your goals and we will suggest the best path.
                </p>
                {WHATSAPP_ENABLED ? (
                  <a
                  href={waLink(service.waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white text-[#448834] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Contact Us
                </a>
                ) : (
                  <Link to="/iletisim" className="block bg-white text-[#448834] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  Contact Us
                </Link>
                )}
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72 lg:h-96 mb-6 shadow-md">
                <img
                  src={service.photo}
                  alt={service.photoAlt ?? service.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <span className="inline-flex items-center gap-1.5 bg-[#448834] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    <Icon size={11} />
                    OUR GUIDES
                  </span>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                    {service.subtitle}
                  </h1>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">
                  Pulse Recipe
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">
                  {service.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {service.description}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {service.description2}
                </p>
              </div>

              <AdSenseBlock
                placement="recipeDetail"
                className="mb-4 sm:mb-6 rounded-2xl border border-gray-100 bg-white p-3"
              />

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <h3 className="font-bold text-gray-900 text-base mb-4 sm:mb-5">
                  Highlights
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <CheckCircle
                        size={16}
                        className="text-[#448834] shrink-0 mt-0.5"
                      />
                      <span className="text-gray-700 text-sm leading-relaxed">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:hidden bg-[#448834] rounded-2xl p-5 text-center mb-6">
                <p className="text-white font-bold text-sm mb-1">
                  Need Personalized Help?
                </p>
                <p className="text-white/75 text-xs mb-4 leading-relaxed">
                  Tell us your goals and we will suggest the best path.
                </p>
                {WHATSAPP_ENABLED ? (
                  <a
                  href={waLink(service.waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white text-[#448834] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Contact Us
                </a>
                ) : (
                  <Link to="/iletisim" className="block bg-white text-[#448834] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  Contact Us
                </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
