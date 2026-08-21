import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Services from "../components/Services";
import WhyUs from "../components/WhyUs";
import HowItWorks from "../components/HowItWorks";
import LogoMarquee from "../components/LogoMarquee";
import SEO from "../components/SEO";
import { WA_NUMBER } from "../lib/whatsapp";

const homeSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://renelenerji.com/#website",
      name: "Flavor Journal",
      url: "https://renelenerji.com",
      inLanguage: "en-US",
      publisher: { "@id": "https://renelenerji.com/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://renelenerji.com/#organization",
      name: "Flavor Journal",
      url: "https://renelenerji.com",
      logo: {
        "@type": "ImageObject",
        url: "https://renelenerji.com/food/logo-mark.svg",
      },
      telephone: `+${WA_NUMBER}`,
      email: "hello@renelenerji.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Soma",
        addressRegion: "Manisa",
        addressCountry: "TR",
      },
      sameAs: ["https://www.renelenerji.com"],
    },
    {
      "@type": "Blog",
      "@id": "https://renelenerji.com/#blog",
      name: "Flavor Journal Recipes",
      description:
        "Simple, seasonal, and practical recipes for everyday home cooking.",
      url: "https://renelenerji.com/blog",
      inLanguage: "en-US",
      publisher: { "@id": "https://renelenerji.com/#organization" },
    },
  ],
};

export default function Home() {
  return (
    <>
      <SEO jsonLd={homeSchema} />
      <Hero />
      <Stats />
      <Services />
      <WhyUs />
      <HowItWorks />
      <LogoMarquee />
    </>
  );
}
