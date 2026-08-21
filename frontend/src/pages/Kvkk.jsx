import LegalPage from "../components/LegalPage";
import { LEGAL_CONTACT, LEGAL_UPDATED, LEGAL_OWNER } from "../lib/legal";

const SECTIONS = [
  {
    title: "1. Who we are",
    body: `${LEGAL_OWNER} ("Flavor Journal", "we", "us") runs this website as a food and recipe publication. We decide why and how the personal data described below is processed, which makes us the data controller for it.

Contact: ${LEGAL_CONTACT}`,
  },
  {
    title: "2. Data we collect",
    body: `We keep data collection to what the site actually needs:

- Contact form: your name, phone number, city or district, the topic you selected, an optional monthly food budget, and your message.
- Chat assistant: the messages you send, the status of your request, and an optional rating score.
- Technical data: your IP address and server access logs, kept for security and abuse prevention.
- Usage analytics: aggregated, non-identifying data such as page views and referrers.
- Advertising data: when advertising is enabled, our advertising partners may set or read cookies and similar identifiers. See section 5 and our Cookie Policy.

There is no account registration on this site. If you choose to continue a conversation on WhatsApp, that exchange is governed by WhatsApp's own privacy policy rather than this one.`,
  },
  {
    title: "3. Why we process it, and on what basis",
    body: `We process your data to answer your questions, follow up on requests, keep the site secure, measure how our recipes are read, and fund the site through advertising.

Depending on the data, we rely on your consent (contact form, advertising and analytics cookies where consent is required), on our legitimate interest in running and securing the site, or on a legal obligation. Where we rely on consent, you can withdraw it at any time.

We do not sell your personal data, and we do not use your contact details for unrelated marketing.`,
  },
  {
    title: "4. Cookies and similar technologies",
    body: `Cookies are small files stored on your device. We use strictly necessary cookies for the site to function, and — when advertising is enabled — our advertising partners use cookies to serve and measure ads.

Our Cookie Policy explains each category and how to control them.`,
    links: [{ label: "Read the Cookie Policy", href: "/cookies" }],
  },
  {
    title: "5. Advertising and third-party vendors",
    body: `This site may display advertising served by Google.

- Google, as a third-party vendor, uses cookies to serve ads on this site.
- Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.
- You can opt out of personalised advertising by visiting Google's Ads Settings.
- You can opt out of a third-party vendor's use of cookies for personalised advertising at aboutads.info.

Third-party vendors and ad networks other than Google may also serve ads on this site. Those vendors use their own cookies and are governed by their own privacy policies. We do not control the data they collect.

Where the law requires it, personalised advertising is only served after you have given consent. When advertising is enabled, that consent is collected through a Google-certified consent management platform, and you can change or withdraw your choice from the same notice at any time.`,
    links: [
      { label: "Google Ads Settings — opt out of personalised ads", href: "https://adssettings.google.com" },
      { label: "How Google uses data from sites that use its services", href: "https://policies.google.com/technologies/partner-sites" },
      { label: "aboutads.info — industry opt-out page", href: "https://www.aboutads.info/choices/" },
      { label: "youronlinechoices.eu — EU opt-out page", href: "https://www.youronlinechoices.eu/" },
    ],
  },
  {
    title: "6. Analytics and error monitoring",
    body: `We use a privacy-focused, self-hosted analytics tool that reports aggregated traffic figures and does not build advertising profiles of visitors.

We also use an error monitoring service that records technical details of crashes (such as the page, browser and error message) so we can fix them. It is configured not to send personally identifying information.`,
  },
  {
    title: "7. How long we keep it",
    body: `- Contact form submissions are automatically deleted after 12 months.
- Chat message content is automatically deleted after 6 months.
- Server logs are kept only as long as needed for security and legal purposes.
- Cookie lifetimes are listed in the Cookie Policy.`,
  },
  {
    title: "8. Sharing",
    body: `We share personal data only with the service providers that make the site work — hosting, error monitoring, analytics and, where enabled, advertising — and only to the extent they need it. We may also disclose data where we are legally required to.

Some of these providers operate outside your country, which can mean your data is transferred internationally. Where that happens we rely on the safeguards those providers put in place, such as standard contractual clauses.`,
  },
  {
    title: "9. Your rights",
    body: `Subject to the law that applies to you, you may ask us to give you access to your personal data, correct it, delete it, restrict or object to its processing, or provide it in a portable format. You may also withdraw consent at any time and lodge a complaint with your data protection authority.

Send requests to ${LEGAL_CONTACT}. We answer within the period the applicable law allows.`,
  },
  {
    title: "10. Children",
    body: `This site is intended for a general audience and is not directed at children under 13 (or the minimum age in your country). We do not knowingly collect their personal data. If you believe a child has given us personal data, contact us and we will delete it.`,
  },
  {
    title: "11. Changes to this policy",
    body: `We may update this policy as the site changes. The date at the top always reflects the current version. Material changes will be highlighted on the site.`,
  },
];

export default function Kvkk() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How Flavor Journal collects, uses and protects your personal data, including cookies and third-party advertising."
      updated={LEGAL_UPDATED}
      intro="This policy explains what we collect when you read our recipes, send us a message or use the chat assistant, why we collect it, and the choices you have."
      sections={SECTIONS}
    />
  );
}
