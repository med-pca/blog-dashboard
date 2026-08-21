import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { serializeJsonLd } from "../lib/jsonLd";

const SITE_NAME = "Flavor Journal";
const SITE_URL = "https://renelenerji.com";
const DEFAULT_IMAGE = "https://renelenerji.com/og-image.webp";
const DEFAULT_DESC =
  "Fresh recipes, practical kitchen tips, and seasonal food inspiration.";

export default function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const { pathname } = useLocation();
  const canonical = `${SITE_URL}${pathname}`;
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `Easy Home Recipes | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>
      )}
    </Helmet>
  );
}
