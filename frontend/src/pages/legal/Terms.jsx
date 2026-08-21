import LegalPage from "../../components/LegalPage";
import { LEGAL_CONTACT, LEGAL_JURISDICTION, LEGAL_OWNER, LEGAL_SITE, LEGAL_UPDATED } from "../../lib/legal";

const SECTIONS = [
  {
    title: "1. Agreement",
    body: `By using ${LEGAL_SITE} you agree to these terms. If you do not agree with them, please stop using the site.

We may revise these terms as the site develops. The date at the top shows the current version, and continuing to use the site after a change means you accept the revised terms.`,
  },
  {
    title: "2. What this site is",
    body: `${LEGAL_OWNER} publishes recipes, meal-prep guides and kitchen tips for home cooks. Everything here is offered free of charge and for general information. We are not a restaurant, a shop, or a professional advisory service.`,
  },
  {
    title: "3. Our content",
    body: `The recipes, text, photography, illustrations, logo and layout on this site belong to us or are used with permission, and are protected by copyright and trade mark law.

You may cook our recipes as often as you like, print a copy for your own kitchen, and share a link to any page.

You may not republish a recipe's full text or our photographs elsewhere, present our work as your own, sell or redistribute it, or scrape the site in bulk — including for training machine learning models — without our written permission. If you want to feature a recipe, link to it and use your own words and photographs.`,
  },
  {
    title: "4. What you send us",
    body: `When you send a message through the contact form or the chat assistant, you confirm the information is accurate and that you are entitled to share it.

Do not send anything unlawful, abusive, or infringing, and do not send sensitive personal information — we do not need it. You keep ownership of what you send, but you allow us to read and use it to answer you and to improve the service.`,
  },
  {
    title: "5. Advertising and external links",
    body: `This site may carry third-party advertising, and pages may link to other websites.

We do not control advertisements or linked sites, and including them is not an endorsement of the products, services or opinions found there. Any dealing you have with an advertiser or a third-party site is between you and them.`,
  },
  {
    title: "6. Availability",
    body: `We try to keep the site online and correct, but we do not promise it will be uninterrupted or error-free. We may change, suspend or withdraw any part of it — including individual recipes — at any time and without notice.`,
  },
  {
    title: "7. No warranty and limits of liability",
    body: `The site is provided "as is" and "as available", without warranties of any kind, whether express or implied, to the fullest extent the law allows.

Cooking involves heat, sharp tools and raw ingredients, and results depend on your equipment, your ingredients and your technique. You use the recipes and information here at your own risk. Please read the Disclaimer as well.

To the extent permitted by law, we are not liable for indirect or consequential loss arising from your use of this site. Nothing in these terms limits liability that cannot lawfully be limited, including for death or personal injury caused by negligence, or for fraud.`,
    links: [{ label: "Read the Disclaimer", href: "/disclaimer" }],
  },
  {
    title: "8. Privacy",
    body: `How we handle personal data is set out in the Privacy Policy and the Cookie Policy, which form part of these terms.`,
    links: [
      { label: "Privacy Policy", href: "/kvkk" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
  {
    title: "9. Governing law",
    body: `These terms are governed by the laws of ${LEGAL_JURISDICTION}, and disputes fall to the courts there — without affecting any consumer protection you have under the law of the country where you live.`,
  },
  {
    title: "10. Contact",
    body: `Questions about these terms: ${LEGAL_CONTACT}`,
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The terms that apply when you use Flavor Journal, including how our recipes and content may be used."
      updated={LEGAL_UPDATED}
      intro="These terms set out what you can expect from Flavor Journal and what we ask of you in return."
      sections={SECTIONS}
    />
  );
}
