import PageHeader from "../components/PageHeader";
import References from "../components/References";
import SEO from "../components/SEO";

const referanslarJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Community | Flavor Journal",
  url: "https://renelenerji.com/referanslar",
  description:
    "Community stories and reader feedback from people cooking with Flavor Journal recipes.",
  about: {
    "@type": "Organization",
    name: "Flavor Journal",
    url: "https://renelenerji.com",
  },
};

export default function Referanslar() {
  return (
    <>
      <SEO
        title="Community"
        description="Community stories and reader feedback from people cooking with Flavor Journal recipes."
        jsonLd={referanslarJsonLd}
      />
      <PageHeader title="Community" />
      <References />
    </>
  );
}
