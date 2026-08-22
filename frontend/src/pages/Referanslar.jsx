import PageHeader from "../components/PageHeader";
import References from "../components/References";
import SEO from "../components/SEO";

const referanslarJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Community | Pulse Recipe",
  url: "https://renelenerji.com/referanslar",
  description:
    "Community stories and reader feedback from people cooking with Pulse Recipe recipes.",
  about: {
    "@type": "Organization",
    name: "Pulse Recipe",
    url: "https://renelenerji.com",
  },
};

export default function Referanslar() {
  return (
    <>
      <SEO
        title="Community"
        description="Community stories and reader feedback from people cooking with Pulse Recipe recipes."
        jsonLd={referanslarJsonLd}
      />
      <PageHeader title="Community" />
      <References />
    </>
  );
}
