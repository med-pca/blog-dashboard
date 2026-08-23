import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitQuoteRequest } from "../api/quote";

const INPUT_CLASS =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-1";

const INITIAL_FORM = {
  name: "",
  email: "",
  message: "",
  kvkkConsent: false,
  website: "", // honeypot
};

// Embedded on the Iletisim page. Collects only what is needed to write back:
// a name, an email and the message itself.
export default function TeklifForm({ onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await submitQuoteRequest({
        name: form.name,
        email: form.email,
        message: form.message || undefined,
        kvkkConsent: form.kvkkConsent,
        website: form.website || undefined,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err.message || "Your message could not be sent. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8 px-4">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle2 size={40} className="text-[#448834]" />
        </div>
        <p className="font-semibold text-gray-900 mb-1.5">Message received</p>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Thanks for writing in — we reply within a few working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot: real users neither see nor fill this */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px opacity-0"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS} htmlFor="contact-name">
            Full Name *
          </label>
          <input
            id="contact-name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS} htmlFor="contact-email">
            Email *
          </label>
          <input
            id="contact-email"
            type="email"
            required
            maxLength={180}
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="contact-message">
          Your message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          maxLength={2000}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="A recipe question, a correction, or anything else."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          required
          checked={form.kvkkConsent}
          onChange={(e) => setForm({ ...form, kvkkConsent: e.target.checked })}
          className="w-4 h-4 mt-0.5 rounded accent-[#448834] shrink-0"
        />
        <span className="text-sm text-gray-600">
          I have read the{" "}
          <a
            href="/kvkk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#448834] hover:underline"
          >
            Privacy Policy
          </a>{" "}
          and I accept the processing of my personal data.
        </span>
      </label>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#448834] hover:bg-[#357228] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
