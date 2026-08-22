import { useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  Award,
  Wrench,
  Leaf,
  BarChart3,
  HeartHandshake,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SEO from "../../components/SEO";
import { waLink, WHATSAPP_ENABLED } from "../../lib/whatsapp";
import { SITE_URL } from "../../lib/site";

const pages = [
  {
    slug: "muhendislik-altyapisi",
    icon: Award,
    title: "Chef-Tested Methods",
    photo: "/food/illustration-1.svg",
    subtitle:
      "Every recipe is developed with measured steps and repeatable technique.",
    description:
      "Each article starts with tested ratios, timing notes, and practical temperature guidance so home cooks can reproduce results with confidence.",
    description2:
      "We break down why each step matters, from ingredient prep to final texture checks, so your dishes stay consistent every time.",
    features: [
      "Step-by-step method with exact sequencing",
      "Timing checkpoints and visual doneness cues",
      "Ingredient substitutions that still work",
      "Pan, heat, and oven setup guidance",
      "Troubleshooting for common mistakes",
      "Printable notes for repeat cooking sessions",
    ],
    waMessage:
      "Hi, I want to learn more about your chef-tested recipe workflow.",
  },
  {
    slug: "anahtar-teslim-hizmet",
    icon: Wrench,
    title: "Complete Meal Guides",
    photo: "/food/illustration-2.svg",
    subtitle: "From shopping to plating, we guide the full cooking journey.",
    description:
      "Our complete guides cover ingredient planning, prep, cooking, and serving so you can execute entire meals without stress.",
    description2:
      "You get organized instructions that reduce confusion and save time in the kitchen, especially on busy weekdays.",
    features: [
      "Ingredient list organized by shopping order",
      "Prep timeline before cooking starts",
      "Main and side pairing suggestions",
      "Serving and plating ideas",
      "Storage and reheating instructions",
      "Optional make-ahead workflow",
      "Beginner-friendly kitchen shortcuts",
    ],
    waMessage: "Hi, I would like complete meal planning and cooking guidance.",
  },
  {
    slug: "surdurulebilir-enerji",
    icon: Leaf,
    title: "Sustainable Cooking",
    photo: "/food/illustration-3.svg",
    subtitle:
      "Cook better while reducing waste and using ingredients mindfully.",
    description:
      "We focus on seasonal ingredients, low-waste preparation, and practical habits that make your kitchen more sustainable.",
    description2:
      "Simple planning can reduce food waste, save money, and make everyday cooking more intentional.",
    features: [
      "Seasonal ingredient alternatives",
      "Zero-waste prep suggestions",
      "Smart leftovers transformation ideas",
      "Batch cooking with storage tips",
      "Portion planning for small households",
      "Budget-friendly ingredient rotations",
    ],
    waMessage: "Hi, I am interested in sustainable cooking tips and recipes.",
  },
  {
    slug: "verimlilik-odakli",
    icon: BarChart3,
    title: "Efficiency-Focused Cooking",
    photo: "/food/illustration-4.svg",
    subtitle: "Maximize flavor with less time, fewer tools, and smarter prep.",
    description:
      "Our efficiency approach helps you cook faster without sacrificing taste, using prep sequencing, multitasking, and workflow design.",
    description2:
      "You learn how to reduce kitchen friction and still deliver full, balanced meals.",
    features: [
      "20 to 40 minute meal blueprints",
      "One-pan and minimal-dish options",
      "Parallel prep and cook timing",
      "Ingredient overlap for weekly menus",
      "Heat management for consistent texture",
      "Time-saving mise en place system",
    ],
    waMessage: "Hi, I want fast and efficient recipes for busy days.",
  },
  {
    slug: "yerel-ve-guvenilir",
    icon: HeartHandshake,
    title: "Community and Trust",
    photo: "/food/illustration-1.svg",
    subtitle: "Built around practical feedback from real home kitchens.",
    description:
      "Our content is shaped by reader questions, tested revisions, and community feedback to keep recipes practical and reliable.",
    description2:
      "When a recipe needs improvement, we update it with clearer directions and stronger troubleshooting notes.",
    features: [
      "Reader-tested updates and revisions",
      "Clear FAQ support for each recipe type",
      "Guidance for common appliance differences",
      "Family-size and small-batch variations",
      "Transparent updates when methods change",
      "Friendly support through contact channels",
    ],
    waMessage: "Hi, I have a recipe question and would like your guidance.",
  },
  {
    slug: "onayli-ekipmanlar",
    icon: CheckCircle,
    title: "Kitchen Gear Recommendations",
    photo: "/food/illustration-2.svg",
    subtitle: "Only practical tools that help you cook consistently.",
    description:
      "We recommend dependable cookware and gadgets based on real use, ease of cleaning, and value for daily cooking.",
    description2:
      "No overcomplicated setups: just essential tools that improve texture, timing, and confidence in the kitchen.",
    features: [
      "Beginner starter gear checklists",
      "Budget and premium tool options",
      "Pan and knife care basics",
      "Appliance use and safety notes",
      "Accessory picks for batch cooking",
      "Upgrade suggestions as your skills grow",
    ],
    waMessage: "Hi, can you recommend essential kitchen tools for me?",
  },
];

export default function NedenBizDetay() {
  const { slug } = useParams();
  const page = pages.find((p) => p.slug === slug);

  const activeChipRef = useRef(null);
  const chipContainerRef = useRef(null);

  useEffect(() => {
    const container = chipContainerRef.current;
    const chip = activeChipRef.current;
    if (!container || !chip) return;
    container.scrollLeft =
      chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
  }, [slug]);

  if (!page) return <Navigate to="/" replace />;

  const Icon = page.icon;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${page.title} | Pulse Recipe`,
    description: page.description,
    url: `${SITE_URL}/neden-biz/${page.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Pulse Recipe",
      url: SITE_URL,
    },
  };

  return (
    <>
      <SEO
        title={page.title}
        description={`${page.subtitle} ${page.description}`.slice(0, 160)}
        jsonLd={jsonLd}
      />
      <PageHeader
        title={page.title}
        parent={{ to: "/kurumsal", label: "Why Us?" }}
      />

      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-24 z-40">
        <div
          ref={chipContainerRef}
          className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none"
        >
          {pages.map((p) => {
            const PIcon = p.icon;
            const active = p.slug === slug;
            return (
              <Link
                key={p.slug}
                ref={active ? activeChipRef : null}
                to={`/neden-biz/${p.slug}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? "bg-[#448834] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <PIcon size={12} />
                {p.title}
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
                  <p className="text-white font-bold text-sm">
                    Why Pulse Recipe?
                  </p>
                </div>
                <nav className="divide-y divide-gray-50">
                  {pages.map((p) => {
                    const PIcon = p.icon;
                    const active = p.slug === slug;
                    return (
                      <Link
                        key={p.slug}
                        to={`/neden-biz/${p.slug}`}
                        className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors group ${
                          active
                            ? "bg-[#448834]/8 text-[#448834] font-semibold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#448834]"
                        }`}
                      >
                        <PIcon
                          size={15}
                          className={
                            active
                              ? "text-[#448834]"
                              : "text-gray-400 group-hover:text-[#448834]"
                          }
                        />
                        <span className="flex-1 leading-snug">{p.title}</span>
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
                  Ask for Guidance
                </p>
                <p className="text-white/75 text-xs mb-4 leading-relaxed">
                  Tell us what you cook most and we will suggest the right
                  recipes.
                </p>
                {WHATSAPP_ENABLED ? (
                  <a
                  href={waLink(page.waMessage)}
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
                  src={page.photo}
                  alt={page.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <span className="inline-flex items-center gap-1.5 bg-[#448834] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    <Icon size={11} />
                    WHY FLAVOR JOURNAL?
                  </span>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                    {page.subtitle}
                  </h1>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">
                  Pulse Recipe
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">
                  {page.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {page.description}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {page.description2}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <h3 className="font-bold text-gray-900 text-base mb-4 sm:mb-5">
                  Highlights
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {page.features.map((f) => (
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
                  Ask for Guidance
                </p>
                <p className="text-white/75 text-xs mb-4 leading-relaxed">
                  Tell us what you cook most and we will suggest the right
                  recipes.
                </p>
                {WHATSAPP_ENABLED ? (
                  <a
                  href={waLink(page.waMessage)}
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
