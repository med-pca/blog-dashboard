import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Services from "../components/Services";
import WhyUs from "../components/WhyUs";
import HowItWorks from "../components/HowItWorks";
import LatestPosts from "../components/LatestPosts";
import LogoMarquee from "../components/LogoMarquee";
import SEO from "../components/SEO";
import { SITE_URL } from "../lib/site";

const homeSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Pulse Recipe",
      url: SITE_URL,
      inLanguage: "en-US",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Pulse Recipe",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/food/logo-mark.svg`,
      },
      email: "contact@pulserecipe.com",
    },
    {
      "@type": "Blog",
      "@id": `${SITE_URL}/#blog`,
      name: "Pulse Recipe Blog",
      description:
        "Simple, seasonal, and practical recipes for everyday home cooking.",
      url: `${SITE_URL}/blog`,
      inLanguage: "en-US",
      publisher: { "@id": `${SITE_URL}/#organization` },
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
      <LatestPosts />
      <LogoMarquee />
    </>
  );
}
