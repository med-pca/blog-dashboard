import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import Services from "../components/Services";
import { SITE_URL } from "../lib/site";

const recipesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Guides | Pulse Recipe",
  url: `${SITE_URL}/guides`,
  description:
    "Practical cooking guides: meal prep, weeknight dinners, budget cooking, kitchen setup and the techniques underneath every recipe.",
};

export default function Hizmetler() {
  return (
    <>
      <SEO
        title="Guides"
        description="Practical cooking guides: meal prep, weeknight dinners, budget cooking, kitchen setup and the techniques underneath every recipe."
        jsonLd={recipesJsonLd}
      />
      <PageHeader title="Guides" />
      <Services />
    </>
  );
}
