import { Link } from "react-router-dom";
import {
  Award,
  Wrench,
  Leaf,
  BarChart3,
  HeartHandshake,
  CheckCircle,
} from "lucide-react";
import { waLink, WHATSAPP_ENABLED } from "../lib/whatsapp";

const WA_MESSAGE =
  "Hi, I would like personalized recipe guidance for my weekly cooking routine.";

const reasons = [
  {
    icon: Award,
    title: "Carefully Reviewed Drafts",
    slug: "tested-recipes",
    desc: "Every published draft is checked for clarity, internal consistency, food-safety wording, and useful step guidance.",
  },
  {
    icon: Wrench,
    title: "Practical Cooking System",
    slug: "practical-system",
    desc: "From prep to plating, we provide repeatable workflows that save time every week.",
  },
  {
    icon: Leaf,
    title: "Seasonal Ingredients",
    slug: "seasonal-ingredients",
    desc: "Cook with seasonal produce to improve flavor, reduce waste, and shop smarter.",
  },
  {
    icon: BarChart3,
    title: "Budget Aware Planning",
    slug: "budget-planning",
    desc: "Simple budget strategies help you keep meals satisfying without overspending.",
  },
  {
    icon: HeartHandshake,
    title: "Friendly Community",
    slug: "friendly-community",
    desc: "A warm space for shared tips, food inspiration, and everyday kitchen confidence.",
  },
  {
    icon: CheckCircle,
    title: "Reliable Methodology",
    slug: "reliable-methodology",
    desc: "Ingredient notes, clear measures, and realistic timing make recipes easier to follow.",
  },
];

export default function WhyUs() {
  return (
    <section
      id="hakkimizda"
      className="relative py-24 bg-gray-50 overflow-hidden"
    >
      <img
        src="/food/section-bg.svg"
        alt=""
        className="hidden lg:block absolute top-0 right-0 h-full w-[130%] object-cover object-right pointer-events-none select-none z-0"
        loading="lazy"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10 lg:hidden">
          <span className="block text-[#357228] font-semibold text-sm mb-3">
            WHY FLAVOR JOURNAL?
          </span>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
            Your Friendly Kitchen Companion
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            We simplify home cooking with reviewed recipes, practical methods, and
            food-first guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Header — inside the grid on desktop only */}
          <div className="hidden lg:flex flex-col justify-center py-4 pr-4 text-center">
            <span className="block text-[#357228] font-semibold text-sm mb-3">
              WHY FLAVOR JOURNAL?
            </span>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
              Your Friendly Kitchen Companion
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              We simplify home cooking with reviewed recipes, practical methods,
              and food-first guidance.
            </p>
          </div>

          {/* 6 kart */}
          {reasons.map(({ icon, title, slug, desc }) => {
            const Icon = icon;
            return (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-100 border-b-4 border-b-transparent hover:border-b-[#357228] p-7 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
              >
                <Icon size={28} className="text-[#357228]" />
                <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                <p className="text-gray-500 text-base leading-relaxed flex-1">
                  {desc}
                </p>
                <Link
                  to={`/why-us/${slug}`}
                  aria-label={`More details about ${title}`}
                  className="text-[#357228] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all w-fit"
                >
                  Learn More <span>›</span>
                </Link>
              </div>
            );
          })}

          {/* CTA */}
          <div className="sm:col-span-2 lg:col-span-1 p-6 flex flex-col items-center justify-center text-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm lg:bg-transparent lg:border-0 lg:shadow-none">
            <h3 className="font-bold text-gray-900 text-2xl leading-snug">
              Let Us Plan Your Next Menu
            </h3>
            <p className="text-gray-500 text-base">
              Reach out for recipe ideas tailored to your routine.
            </p>
            {WHATSAPP_ENABLED ? (
              <a
              href={waLink(WA_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#357228] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#2d6124] transition-colors"
            >
              Get Suggestions
            </a>
            ) : (
              <Link to="/contact" className="inline-flex items-center justify-center bg-[#357228] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#2d6124] transition-colors">
              Get Suggestions
            </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
