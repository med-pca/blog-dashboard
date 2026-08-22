import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import Services from "../components/Services";
import { SITE_URL } from "../lib/site";

const recipesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Recipes | Pulse Recipe",
  url: `${SITE_URL}/hizmetler`,
  description:
    "Explore recipes by meal type, kitchen skills, and practical food guides for everyday home cooking.",
};

export default function Hizmetler() {
  return (
    <>
      <SEO
        title="Recipes"
        description="Explore recipes by meal type, kitchen skills, and practical food guides for everyday home cooking."
        jsonLd={recipesJsonLd}
      />
      <PageHeader title="Recipes" />
      <Services />
    </>
  );
}
