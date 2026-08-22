import { Phone, Mail, MapPin, Clock, MessageSquare } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import TeklifForm from "../components/TeklifForm";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Pulse Recipe",
  url: "https://pulserecipe.com",
  telephone: "+17065758955",
  email: "contact@pulserecipe.com",
  image: "https://pulserecipe.com/og-image.webp",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Kurtulus, Inkilap St. no:4 D:J",
    addressLocality: "Soma",
    addressRegion: "Manisa",
    postalCode: "45500",
    addressCountry: "TR",
  },
  geo: { "@type": "GeoCoordinates", latitude: 39.188, longitude: 27.613 },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "08:00",
      closes: "18:00",
    },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+17065758955",
    contactType: "customer service",
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

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <a
              href="https://maps.google.com/?q=Kurtulus,+Inkilap+Sk.+no:4+D:J,+45500+Soma/Manisa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all border-b-4 border-b-[#f5ce31]"
            >
              <MapPin size={26} className="text-[#448834] shrink-0" />
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">
                  Address
                </p>
                <p className="font-semibold text-gray-800">
                  Kurtulus, Inkilap St. no:4 D:J
                </p>
                <p className="text-gray-500 text-sm mt-0.5">
                  45500 Soma / Manisa
                </p>
              </div>
            </a>

            <a
              href="tel:+17065758955"
              className="flex items-center gap-5 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all border-b-4 border-b-[#448834]"
            >
              <Phone size={26} className="text-[#448834] shrink-0" />
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Phone</p>
                <p className="font-semibold text-gray-800">+1 706 575 89 55</p>
              </div>
            </a>

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
              </div>
            </a>

            <div className="flex items-center gap-5 bg-white border border-gray-200 rounded-2xl p-7 border-b-4 border-b-[#448834]">
              <Clock size={26} className="text-[#448834] shrink-0" />
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">
                  Working Hours
                </p>
                <p className="font-semibold text-gray-800">
                  Mon – Sat: 08:00 – 18:00
                </p>
                <p className="text-gray-500 text-sm mt-0.5">
                  Sunday: By appointment
                </p>
              </div>
            </div>
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

      <section className="pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm h-65 sm:h-90 lg:h-105">
            <iframe
              title="Pulse Recipe Location"
              src="https://maps.google.com/maps?q=Kurtulus%2C%20Inkilap%20Sk.%20No%3A4%2C%2045500%20Soma%2FManisa&output=embed&hl=en"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
