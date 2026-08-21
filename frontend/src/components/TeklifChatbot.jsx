import { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  Loader2,
  MessageCircle,
  Star,
  CookingPot,
  ChefHat,
  Utensils,
  Refrigerator,
  PiggyBank,
  Wrench,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import {
  sendChatMessage,
  generateWhatsappSummary,
  submitChatRating,
  trackChatOpen,
} from "../api/chat";
import { WA_NUMBER, waLink } from "../lib/whatsapp";

const RATED_KEY = "chatRated";

// Sayfa yüklemesi başına tek açılma eventi (aynı konuşmanın aç/kapa'sı tekrar sayılmaz)
let openTracked = false;

const GREETING =
  "Welcome to Flavor Journal. I can ask a few quick questions to suggest the most suitable recipes and cooking workflow. What would you like help with?";

const QUICK_REPLIES = [
  {
    label: "Quick Weeknight Meals",
    desc: "Fast recipes for busy evenings",
    icon: CookingPot,
    value: "I want quick weeknight meal ideas.",
  },
  {
    label: "Meal Prep Planning",
    desc: "Batch cooking and storage guidance",
    icon: ChefHat,
    value: "I need meal prep and batch cooking guidance.",
  },
  {
    label: "Kitchen Tools",
    desc: "Practical gear recommendations",
    icon: Utensils,
    value: "Can you suggest useful kitchen tools for my level?",
  },
  {
    label: "Budget Cooking",
    desc: "Lower cost recipes and planning",
    icon: PiggyBank,
    value: "I want budget-friendly recipes and planning tips.",
  },
  {
    label: "Recipe Troubleshooting",
    desc: "Fix texture, timing, or flavor issues",
    icon: Wrench,
    value: "I need help fixing issues in my current recipes.",
  },
  {
    label: "Kitchen Setup",
    desc: "Workflow and space organization",
    icon: Refrigerator,
    value: "How can I organize my kitchen setup for easier cooking?",
  },
  {
    label: "Menu Planning",
    desc: "Weekly menu and shopping strategy",
    icon: CalendarDays,
    value: "I want a weekly menu planning strategy.",
  },
  {
    label: "Cooking Improvement",
    desc: "Technique and consistency coaching",
    icon: Sparkles,
    value: "Help me improve my cooking consistency and technique.",
  },
];

export default function TeklifChatbot({
  onClose,
  closing,
  messages: initialMessages,
  onMessagesChange,
  sessionId,
  prefill,
}) {
  const [messages, setMessages] = useState(
    initialMessages ?? [{ role: "assistant", content: GREETING }],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [ratingView, setRatingView] = useState(false); // false | 'rate' | 'thanks'
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const closeTimerRef = useRef(null);

  function saveMessages(next) {
    setMessages(next);
    onMessagesChange?.(next);
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const showWhatsapp =
    !!lastAssistant &&
    lastAssistant.content !== GREETING &&
    /whatsapp/i.test(lastAssistant.content);

  useEffect(() => {
    if (messagesRef.current)
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = 0;
    if (prefill) {
      send(prefill);
    } else {
      inputRef.current?.focus();
    }
    if (!openTracked) {
      openTracked = true;
      trackChatOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user", content: trimmed };
    const updated = [...messages, userMessage];
    saveMessages(updated);
    setInput("");
    setLoading(true);

    try {
      // Geçmiş sunucuda sessionId ile tutulur; yalnızca yeni mesaj gönderilir
      const { reply } = await sendChatMessage(trimmed, sessionId);
      const withReply = [...updated, { role: "assistant", content: reply }];
      saveMessages(withReply);
    } catch {
      const withError = [
        ...updated,
        {
          role: "assistant",
          content:
            "Sorry, I cannot respond right now. Please contact us directly: 0554 379 60 04",
        },
      ];
      saveMessages(withError);
    } finally {
      setLoading(false);
    }
  }

  async function handleWhatsapp() {
    setSummaryLoading(true);
    try {
      const { text } = await generateWhatsappSummary(sessionId);
      window.open(waLink(text), "_blank", "noopener,noreferrer");
    } catch {
      window.open(
        `https://wa.me/${WA_NUMBER}`,
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      setSummaryLoading(false);
      // WhatsApp'a geçiş görüşmenin doğal sonu — sekmeye dönünce değerlendirme sor
      if (!sessionStorage.getItem(RATED_KEY)) setRatingView("rate");
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function requestClose() {
    const alreadyRated = sessionStorage.getItem(RATED_KEY);
    if (!ratingView && !alreadyRated && userMessageCount >= 2) {
      setRatingView("rate");
      return;
    }
    onClose();
  }

  function handleRate(star) {
    setSelectedStar(star);
    setRatingView("thanks");
    sessionStorage.setItem(RATED_KEY, "1");
    submitChatRating(star, sessionId).catch(() => {});
    closeTimerRef.current = setTimeout(onClose, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:inset-auto sm:bottom-20 sm:right-6">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm sm:hidden ${closing ? "backdrop-exit" : "backdrop-enter"}`}
        onClick={requestClose}
      />

      <div
        className={`relative w-full sm:w-100 h-[85vh] sm:h-140 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden origin-bottom sm:origin-bottom-right ${closing ? "chatbot-exit" : "chatbot-enter"}`}
      >
        {/* Header */}
        <div className="bg-[#448834] px-5 py-4 flex items-center gap-3 shrink-0">
          <img
            src="/food/logo-mark.svg"
            alt="Flavor Journal"
            className="w-10 h-10"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">
              Flavor Journal Assistant
            </p>
            <p className="text-white/70 text-xs">
              Let us find what fits your kitchen best
            </p>
          </div>
          <button
            onClick={requestClose}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Rating overlay */}
        {ratingView && (
          <div className="absolute inset-0 top-[72px] z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5 px-8 text-center">
            {ratingView === "rate" ? (
              <>
                <div>
                  <p className="font-semibold text-gray-800">
                    Would you rate this chat?
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Your feedback helps us improve
                  </p>
                </div>
                <div
                  className="flex gap-2"
                  onMouseLeave={() => setHoverStar(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setHoverStar(star)}
                      className="p-1 transition-transform hover:scale-115"
                      aria-label={`${star} stars`}
                    >
                      <Star
                        size={30}
                        className={
                          star <= hoverStar ? "text-amber-400" : "text-gray-300"
                        }
                        fill={star <= hoverStar ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Not now
                </button>
              </>
            ) : (
              <>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={26}
                      className={
                        star <= selectedStar
                          ? "text-amber-400"
                          : "text-gray-200"
                      }
                      fill={star <= selectedStar ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <p className="font-semibold text-gray-800">Thank you!</p>
              </>
            )}
          </div>
        )}

        {/* Messages */}
        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url(/food/chat-pattern.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5 shadow-sm border border-gray-100">
                  <img src="/food/logo-mark.svg" alt="Flavor Journal" className="w-6 h-6" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#448834] text-white rounded-br-sm"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {/* Quick reply cards */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-col gap-2">
              {QUICK_REPLIES.map((qr) => {
                const Icon = qr.icon;
                return (
                  <button
                    key={qr.label}
                    onClick={() => send(qr.value)}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 bg-white border border-gray-200 hover:border-[#448834] hover:bg-[#f5fbf3] rounded-xl transition-colors shadow-sm group"
                  >
                    <Icon size={16} className="text-[#448834] shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {qr.label}
                      </p>
                      <p className="text-xs text-gray-400">{qr.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5 shadow-sm border border-gray-100">
                <img src="/food/logo-mark.svg" alt="Flavor Journal" className="w-6 h-6" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 size={16} className="text-[#448834] animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp butonu */}
        {showWhatsapp && (
          <div className="px-4 pt-3 bg-white border-t border-gray-100 shrink-0">
            <button
              onClick={handleWhatsapp}
              disabled={summaryLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              {summaryLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <MessageCircle size={16} />
              )}
              {summaryLoading ? "Preparing..." : "Continue on WhatsApp"}
            </button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pt-3 pb-2 bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#448834] transition-colors max-h-24 leading-relaxed"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-[#448834] hover:bg-[#357228] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-gray-300 text-center mt-1.5">
            Chat records are stored for service quality ·{" "}
            <a
              href="/kvkk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-400"
            >
              Privacy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
