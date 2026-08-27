import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { serializeJsonLd } from "../lib/jsonLd";
import { SITE_NAME, SITE_URL } from "../lib/site";

const DEFAULT_IMAGE = `${SITE_URL}/og-image.webp`;
const DEFAULT_DESC =
  "Fresh recipes, practical kitchen tips, and seasonal food inspiration.";

export default function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
  // Paginated lists pass these: `canonicalPath` keeps ?page=N in the canonical
  // (each page is its own indexable URL, not a duplicate of page 1), while
  // prevPath/nextPath tell crawlers the pages form one sequence.
  canonicalPath,
  prevPath,
  nextPath,
}) {
  const { pathname } = useLocation();
  const canonical = `${SITE_URL}${canonicalPath ?? pathname}`;
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `Easy Home Recipes | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {prevPath && <link rel="prev" href={`${SITE_URL}${prevPath}`} />}
      {nextPath && <link rel="next" href={`${SITE_URL}${nextPath}`} />}
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
