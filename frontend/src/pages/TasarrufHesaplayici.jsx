import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CookingPot,
  Salad,
  NotebookPen,
  Timer,
  TrendingUp,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import { TARIFFS, calculateGes, parseBillInput } from "../lib/gesCalc";

const formatAmount = (value) => value.toLocaleString("en-US");

const FAQS = [
  {
    question: "How accurate are these estimates?",
    answer:
      "These results are estimate values based on standardized assumptions in this calculator. Actual outcomes can vary by your real usage profile and context, so treat this as a planning tool rather than a final quote.",
  },
  {
    question: "Who should use this calculator?",
    answer:
      "Anyone comparing options before making a decision can use it. It helps you understand scale, expected output, and potential yearly impact from your selected profile.",
  },
  {
    question: "Can I share my result for personalized support?",
    answer:
      "Yes. Use the support button after calculation and we will receive your selected profile and estimate values so we can guide you with more relevant recommendations.",
  },
  {
    question: "Does this replace professional planning?",
    answer:
      "No. It is a fast first-step estimate. Final planning should always include a detailed review and real-world constraints.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Recipe Planning Impact Calculator",
      url: "https://renelenerji.com/tasarruf-hesaplayici",
      description:
        "Enter your monthly food budget to estimate your weekly cooking rhythm, recipe count, and yearly savings.",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: {
        "@type": "Organization",
        name: "Pulse Recipe",
        url: "https://renelenerji.com",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function TasarrufHesaplayici() {
  const [searchParams] = useSearchParams();
  const [bill, setBill] = useState(
    parseBillInput(searchParams.get("fatura") || ""),
  );
  const [tariff, setTariff] = useState(
    TARIFFS.some((t) => t.id === searchParams.get("tarife"))
      ? searchParams.get("tarife")
      : "mesken",
  );

  const result = calculateGes(Number(bill), tariff);

  const cards = result && [
    {
      icon: CookingPot,
      label: "Weekly Cook Sessions",
      value: `${result.systemKwp.toLocaleString("en-US")}`,
    },
    {
      icon: NotebookPen,
      label: "Recipes In Your Plan",
      value: `${result.panelCount} recipes`,
    },
    {
      icon: Timer,
      label: "Average Prep Time",
      value: `~${result.roofArea} min`,
    },
    {
      icon: Salad,
      label: "Estimated Yearly Servings",
      value: `${formatAmount(result.annualProduction)} servings`,
    },
    {
      icon: TrendingUp,
      label: "Estimated Yearly Savings",
      value: `$${formatAmount(result.annualSavings)}`,
    },
  ];

  return (
    <>
      <SEO
        title="Planning Impact Calculator"
        description="Enter your monthly food budget and instantly estimate weekly cook sessions, prep time, and yearly savings potential."
        jsonLd={jsonLd}
      />
      <PageHeader title="Planning Calculator" />

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              How much can you save?
            </h2>
            <p className="text-base text-gray-500 mb-8">
              Enter your monthly food budget to see a suggested cooking plan
              and yearly savings at a glance.
            </p>

            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Cooking Style
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {TARIFFS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTariff(t.id)}
                  className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    tariff === t.id
                      ? "bg-[#448834] text-white"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#448834]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative mb-10">
              <input
                type="text"
                inputMode="numeric"
                value={bill ? Number(bill).toLocaleString("en-US") : ""}
                onChange={(e) => setBill(parseBillInput(e.target.value))}
                placeholder="Your monthly amount"
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 pr-12 sm:pr-14 rounded-xl border border-gray-200 text-base sm:text-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#448834] transition-colors"
              />
              <span className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">
                $
              </span>
            </div>

            {result ? (
              <>
                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                  {cards.map((card) => (
                    <div
                      key={card.label}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-6 flex items-center gap-4"
                    >
                      <card.icon
                        size={36}
                        className="text-[#448834] shrink-0"
                      />
                      <div>
                        <p className="text-3xl font-bold font-['Rajdhani'] text-gray-900 leading-tight">
                          {card.value}
                        </p>
                        <p className="text-sm text-gray-500">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-8">
                  These values are model-based estimates. Final planning and
                  pricing should be confirmed with a detailed review.
                </p>

                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("open-chat", {
                        detail: {
                          prefill: `I used the planning calculator with the ${TARIFFS.find((t) => t.id === tariff)?.label} profile and a monthly budget of $${formatAmount(Number(bill))}. It suggests ${result.systemKwp} weekly cook sessions with estimated yearly savings of $${formatAmount(result.annualSavings)}. I would like personalized guidance.`,
                        },
                      }),
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-base py-4 rounded-xl transition-colors"
                >
                  <MessageCircle size={18} />
                  Get Personalized Guidance
                </button>
              </>
            ) : (
              <p className="text-base text-gray-400 text-center py-8">
                Your results will appear here after you enter a value.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How Is This Estimate Calculated?
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-4">
            <p>
              The calculator converts your monthly input and selected profile
              into an annual estimate model. Then it computes suggested weekly
              cook sessions, recipe count, prep time, and potential yearly
              impact.
            </p>
            <p>
              Real-world results can differ because of constraints and usage
              behavior. Use this tool for first-pass planning, then request
              tailored support for final recommendations.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center gap-4 px-6 py-5 cursor-pointer list-none font-semibold text-gray-900 text-base leading-snug">
                  <span className="flex-1">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className="text-[#448834] shrink-0 transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <p className="px-6 pb-6 pt-0 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
