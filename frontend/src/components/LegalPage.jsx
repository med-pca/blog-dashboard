import PageHeader from "./PageHeader";
import SEO from "./SEO";

/**
 * Shared shell for the legal pages (privacy, cookies, terms, disclaimer).
 * Each section takes a plain-text `body` (blank lines become paragraphs) plus an
 * optional `links` list, which is how the outbound opt-out URLs Google AdSense
 * expects are rendered without putting raw HTML in the copy.
 */
export default function LegalPage({ title, description, updated, intro, sections }) {
  return (
    <>
      <SEO title={title} description={description} />
      <PageHeader title={title} />

      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
              Last updated: {updated}
            </p>
            {intro && (
              <p className="text-sm text-gray-600 leading-relaxed mb-8">{intro}</p>
            )}

            <div className="space-y-8">
              {sections.map(({ title: sectionTitle, body, links }) => (
                <section key={sectionTitle}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {sectionTitle}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {body}
                  </p>
                  {links?.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {links.map(({ label, href }) => (
                        <li key={href}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-sm text-[#448834] hover:underline break-words"
                          >
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
