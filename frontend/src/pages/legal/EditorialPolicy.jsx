import LegalPage from "../../components/LegalPage";
import { LEGAL_CONTACT, LEGAL_UPDATED } from "../../lib/legal";

const SECTIONS = [
  {
    title: "1. Our purpose",
    body: "Pulse Recipe publishes practical recipe ideas and kitchen guides for home cooks. We prioritize clear instructions, accessible ingredients, internal consistency, and information that helps a reader complete the task.",
  },
  {
    title: "2. How content is created",
    body: "Automation and artificial-intelligence tools may assist with topic planning, research organization, and first drafts. AI output is kept as a draft. An administrator must review and approve an article before publication.",
  },
  {
    title: "3. What our review covers",
    body: "Our review checks the title and claims, ingredient quantities, serving yield, sequence of steps, timing consistency, substitutions, storage language, food-safety wording, readability, duplication, and links. Editorial review is not the same as physically cooking a recipe.",
  },
  {
    title: "4. Recipe testing",
    body: "We do not describe a recipe as kitchen-tested, chef-tested, reader-tested, or personally cooked unless that verification actually happened and can be documented. When a recipe has not been physically tested, we present it as an editorially reviewed recipe idea rather than claiming first-hand experience.",
  },
  {
    title: "5. Sources and factual claims",
    body: "We do not knowingly invent studies, statistics, quotations, testimonials, professional qualifications, prices, ratings, or nutritional values. When external safety guidance is necessary, we prefer recognized public-health or food-safety authorities.",
  },
  {
    title: "6. Corrections",
    body: `Readers can report an error at ${LEGAL_CONTACT}. We review credible corrections and update the article when appropriate. Material corrections may be reflected in the page's updated date.`,
  },
  {
    title: "7. Advertising and independence",
    body: "Advertising helps support the site. Advertisers do not receive control over our editorial conclusions. Sponsored content or affiliate relationships will be disclosed clearly on the relevant page.",
  },
];

export default function EditorialPolicy() {
  return (
    <LegalPage
      title="Editorial Policy"
      description="How Pulse Recipe drafts, reviews, corrects, and publishes recipes and cooking guides."
      updated={LEGAL_UPDATED}
      intro="This policy explains how we use editorial review and automation responsibly."
      sections={SECTIONS}
    />
  );
}
