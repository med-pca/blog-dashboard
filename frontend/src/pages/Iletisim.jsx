import { Mail, MessageSquare } from "lucide-react";
import { SITE_URL } from "../lib/site";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import TeklifForm from "../components/TeklifForm";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pulse Recipe",
  url: SITE_URL,
  email: "contact@pulserecipe.com",
  logo: `${SITE_URL}/food/logo-mark.svg`,
  image: `${SITE_URL}/og-image.webp`,
  description:
    "An English-language food blog sharing approachable recipes, meal-prep systems, and practical kitchen guides.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@pulserecipe.com",
    contactType: "editorial",
    availableLanguage: "English",
  },
};

export default function Iletisim() {
  return (
    <>
      <SEO
        title="Contact"
        description="Contact Pulse Recipe for recipe questions, content collaboration, and cooking guidance."
        jsonLd={jsonLd}
      />
      <PageHeader title="Contact" />

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#448834] font-semibold text-sm mb-3">CONTACT</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Get In Touch
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              For recipes, partnerships, and kitchen guidance, reach us through
              the channels below.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <a
              href="mailto:contact@pulserecipe.com"
              className="flex items-center gap-5 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all border-b-4 border-b-[#f5ce31]"
            >
              <Mail size={26} className="text-[#448834] shrink-0" />
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Email</p>
                <p className="font-semibold text-gray-800">
                  contact@pulserecipe.com
                </p>
                <p className="text-gray-500 text-sm mt-0.5">
                  We reply within a few working days.
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="pb-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-7 sm:p-9">
            <div className="flex items-center gap-2.5 mb-6">
              <MessageSquare size={22} className="text-[#448834]" />
              <div>
                <h3 className="font-bold text-gray-900">Send A Message</h3>
                <p className="text-sm text-gray-400">
                  Fill out the form and our team will get back to you.
                </p>
              </div>
            </div>
            <TeklifForm />
          </div>
        </div>
      </section>

    </>
  );
}
