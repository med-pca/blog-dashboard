import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import Services from "../components/Services";

const recipesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Recipes | Flavor Journal",
  url: "https://renelenerji.com/hizmetler",
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
