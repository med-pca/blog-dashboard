import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";

const SECTIONS = [
  {
    title: "1. Data Controller",
    body: `Your personal data is processed by Flavor Journal as the data controller, within the scope explained below.

Contact: mertcan.yilmaz@renelenerji.com`,
  },
  {
    title: "2. Personal Data We Process",
    body: `When you use our website, we may process the following data:

- Contact form data: Name, phone number, city/district, requested topic, optional monthly budget information, and your message.
- Chat records: Messages you send during chat, request status, and optional rating scores.
- Technical data: IP address and server access logs for security purposes.
- Anonymous analytics: Non-identifiable usage data such as page views.

We do not provide account registration on this site. Communication through WhatsApp is subject to WhatsApp's own privacy policy.`,
  },
  {
    title: "3. Purposes and Legal Basis",
    body: `Data is processed to provide support, follow up requests, improve service quality, and maintain platform security. We process this data based on legitimate interest where applicable. Your data is not used for unrelated marketing and is not shared with third parties except where legally required.`,
  },
  {
    title: "4. Retention Period",
    body: `Contact form personal data is automatically deleted after 12 months. Chat message content is automatically deleted after 6 months. Server logs are retained according to legal and operational requirements.`,
  },
  {
    title: "5. Your Rights",
    body: `You may request access, correction, deletion, restriction, or objection regarding your personal data, as permitted by applicable law.

You can submit requests to mertcan.yilmaz@renelenerji.com. Requests are answered within legal response periods.`,
  },
];

export default function Kvkk() {
  return (
    <>
      <SEO
        title="Privacy Notice"
        description="Flavor Journal privacy notice and personal data information."
      />
      <PageHeader title="Privacy Notice" />

      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10 space-y-8">
            {SECTIONS.map(({ title, body }) => (
              <section key={title}>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
