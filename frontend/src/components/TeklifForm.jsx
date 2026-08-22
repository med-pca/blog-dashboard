import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitQuoteRequest } from "../api/quote";
import { waLink, WHATSAPP_ENABLED } from "../lib/whatsapp";

const SERVICE_TYPES = [
  { value: "cati-ges", label: "Home Cooking Plan" },
  { value: "tarimsal-sulama", label: "Meal Prep Workflow" },
  { value: "ev-sarj", label: "Kitchen Gear Guidance" },
  { value: "diger", label: "Other" },
];

const INPUT_CLASS =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-1";

// International-friendly: keep a leading "+", digits and common separators,
// but nothing else. The backend re-normalises, so we only stop obvious junk
// and cap the length. No country is assumed.
function handlePhoneInput(raw) {
  let value = raw.replace(/[^\d+\s()-]/g, "");
  // A "+" is only meaningful as the very first character.
  value = value.replace(/(?!^)\+/g, "");
  return value.slice(0, 20);
}

const INITIAL_FORM = {
  name: "",
  phone: "",
  city: "",
  serviceType: "cati-ges",
  monthlyBill: "",
  message: "",
  kvkkConsent: false,
  website: "", // honeypot
};

// Hem TeklifModal içinde hem Iletisim sayfasında gömülü olarak kullanılır.
// onSuccess: modal kabuğunun otomatik kapanabilmesi için opsiyonel geri çağrı.
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
        phone: form.phone,
        city: form.city || undefined,
        serviceType: form.serviceType,
        monthlyBill: form.monthlyBill ? Number(form.monthlyBill) : undefined,
        message: form.message || undefined,
        kvkkConsent: form.kvkkConsent,
        website: form.website || undefined,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err.message || "Your request could not be sent. Please try again.",
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
        <p className="font-semibold text-gray-900 mb-1.5">Request received</p>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Our team will contact you shortly.
          {WHATSAPP_ENABLED && " If it is urgent, you can also message us on WhatsApp."}
        </p>
        {WHATSAPP_ENABLED && (
          <a
            href={waLink(
              `Hi, this is ${form.name}. I have just submitted the request form.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-sm font-semibold text-[#448834] hover:text-[#357228] transition-colors"
          >
            Message us on WhatsApp
          </a>
        )}
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
          <label className={LABEL_CLASS}>Full Name *</label>
          <input
            type="text"
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={INPUT_CLASS}
            autoComplete="name"
            data-teklif-autofocus
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Phone *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: handlePhoneInput(e.target.value) })
            }
            className={INPUT_CLASS}
            placeholder="+1 706 575 8955"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>City / District</label>
          <input
            type="text"
            maxLength={120}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={INPUT_CLASS}
            placeholder="City / District"
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Which topic? *</label>
          <select
            required
            value={form.serviceType}
            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            className={INPUT_CLASS}
          >
            {SERVICE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Monthly food budget ($)</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={1000000}
          value={form.monthlyBill}
          onChange={(e) => setForm({ ...form, monthlyBill: e.target.value })}
          className={INPUT_CLASS}
          placeholder="Example: 2500"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Your message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${INPUT_CLASS} resize-none`}
          rows={3}
          maxLength={2000}
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
        {loading ? "Sending..." : "Send Request"}
      </button>
    </form>
  );
}
