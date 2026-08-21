import { useEffect, useRef } from "react";
import { X, Utensils } from "lucide-react";
import TeklifForm from "./TeklifForm";

export default function TeklifModal({ closing, onClose }) {
  const firstInputRef = useRef(null);
  const successTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(successTimerRef.current), []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      firstInputRef.current?.querySelector("[data-teklif-autofocus]")?.focus();
    }, 30);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teklif-modal-title"
    >
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${closing ? "backdrop-exit" : "backdrop-enter"}`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col ${closing ? "chatbot-exit" : "chatbot-enter"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <Utensils size={18} className="text-[#448834]" />
            <h3
              id="teklif-modal-title"
              className="font-semibold text-gray-900 text-sm"
            >
              Send a Request
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={firstInputRef} className="px-5 py-5 overflow-y-auto">
          <TeklifForm
            onSuccess={() => {
              successTimerRef.current = setTimeout(onClose, 3500);
            }}
          />
        </div>
      </div>
    </div>
  );
}
