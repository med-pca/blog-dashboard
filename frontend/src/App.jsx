import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useEffect, lazy, Suspense, useState, useRef } from "react";
import { Bot } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TeklifChatbot from "./components/TeklifChatbot";
import PageLoader from "./components/PageLoader";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import { usePageTransitionOverlay } from "./hooks/usePageTransitionOverlay";

const Home = lazy(() => import("./pages/Home"));
const Hizmetler = lazy(() => import("./pages/Hizmetler"));
const HizmetDetay = lazy(() => import("./pages/hizmetler/HizmetDetay"));
const Kurumsal = lazy(() => import("./pages/Kurumsal"));
const Iletisim = lazy(() => import("./pages/Iletisim"));
const Projelerimiz = lazy(() => import("./pages/Projelerimiz"));
const ProjeDetay = lazy(() => import("./pages/projeler/ProjeDetay"));
const NedenBizDetay = lazy(() => import("./pages/neden-biz/NedenBizDetay"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetay = lazy(() => import("./pages/BlogDetay"));
const SSS = lazy(() => import("./pages/SSS"));
const Kvkk = lazy(() => import("./pages/Kvkk"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminGateway = lazy(() => import("./pages/admin/AdminGateway"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ProjelerAdmin = lazy(() => import("./pages/admin/ProjelerAdmin"));
const ProjeForm = lazy(() => import("./pages/admin/ProjeForm"));
const BlogAdmin = lazy(() => import("./pages/admin/BlogAdmin"));
const BlogForm = lazy(() => import("./pages/admin/BlogForm"));
const SSSAdmin = lazy(() => import("./pages/admin/SSSAdmin"));
const ChatDegerlendirme = lazy(() => import("./pages/admin/ChatDegerlendirme"));
const TeklifTalepleri = lazy(() => import("./pages/admin/TeklifTalepleri"));
const Loglar = lazy(() => import("./pages/admin/Loglar"));
const Analitik = lazy(() => import("./pages/admin/Analitik"));
const Guvenlik = lazy(() => import("./pages/admin/Guvenlik"));
const AdsAdmin = lazy(() => import("./pages/admin/AdsAdmin"));
const AiCampaignsAdmin = lazy(() => import("./pages/admin/AiCampaignsAdmin"));
const AiCampaignForm = lazy(() => import("./pages/admin/AiCampaignForm"));
const AiCampaignDetail = lazy(() => import("./pages/admin/AiCampaignDetail"));
const AiLoglar = lazy(() => import("./pages/admin/AiLoglar"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Old Turkish slugs -> the English ones now in the router. Unknown slugs fall
// through to the section landing page instead of a 404.
const LEGACY_GUIDE_SLUGS = {
  sulama: "meal-prep",
  "cati-arazi": "weeknight-dinners",
  "bag-evi": "budget-cooking",
  "ev-sarj": "kitchen-setup",
  "ges-bakim-onarim": "cooking-mistakes",
  "elektrik-altyapi-bakimi": "30-minute-meals",
  "proje-danismanlik": "menu-planning",
  "enerji-danismanlik": "cooking-techniques",
};

const LEGACY_WHY_US_SLUGS = {
  "muhendislik-altyapisi": "tested-recipes",
  "anahtar-teslim-hizmet": "practical-system",
  "surdurulebilir-enerji": "seasonal-ingredients",
  "verimlilik-odakli": "budget-planning",
  "yerel-ve-guvenilir": "friendly-community",
  "onayli-ekipmanlar": "reliable-methodology",
};

function LegacyGuideRedirect() {
  const { slug } = useParams();
  const next = LEGACY_GUIDE_SLUGS[slug];
  return <Navigate to={next ? `/guides/${next}` : "/guides"} replace />;
}

function LegacyWhyUsRedirect() {
  const { slug } = useParams();
  const next = LEGACY_WHY_US_SLUGS[slug];
  return <Navigate to={next ? `/why-us/${next}` : "/"} replace />;
}

// Slug is unchanged, only the prefix moved.
function LegacyPrefixRedirect({ to }) {
  const { slug } = useParams();
  return <Navigate to={`${to}/${slug}`} replace />;
}

function ProtectedRoute({ children }) {
  const auth = useAdminAuth();
  if (!auth || auth.checking) return <PageLoader fullScreen />;
  const { isAuth } = auth;
  if (!isAuth) return <Navigate to="/rnl-panel/login" replace />;
  return children;
}

function PublicLayout() {
  const location = useLocation();
  const showRouteOverlay = usePageTransitionOverlay(location.pathname);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatClosing, setChatClosing] = useState(false);
  const [chatMessages, setChatMessages] = useState(null);
  const [chatPrefill, setChatPrefill] = useState("");
  // Konuşma başına lead takibi için kimlik; sayfa yenilenene kadar sabit (mesajlar gibi)
  const [chatSessionId] = useState(() => crypto.randomUUID());

  const closeChatTimerRef = useRef(null);

  function openChat(prefill = "") {
    clearTimeout(closeChatTimerRef.current);
    setChatClosing(false);
    setChatPrefill(prefill);
    setChatOpen(true);
  }

  function handleCloseChat() {
    setChatClosing(true);
    closeChatTimerRef.current = setTimeout(() => {
      setChatOpen(false);
      setChatClosing(false);
    }, 220);
  }

  return (
    <>
      <ScrollToTop />
      <PageLoader label="" fullScreen overlay show={showRouteOverlay} />
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader fullScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/guides" element={<Hizmetler />} />
            <Route path="/guides/:slug" element={<HizmetDetay />} />
            <Route path="/about" element={<Kurumsal />} />
            <Route path="/collections" element={<Projelerimiz />} />
            <Route path="/collections/:slug" element={<ProjeDetay />} />
            <Route path="/why-us/:slug" element={<NedenBizDetay />} />
            <Route path="/recipes" element={<Blog />} />
            <Route path="/recipes/:slug" element={<BlogDetay />} />
            <Route path="/faq" element={<SSS />} />
            <Route path="/privacy" element={<Kvkk />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/contact" element={<Iletisim />} />

            {/* The site moved off the Turkish route names inherited from the
                solar codebase. Nothing links here any more, but shared links
                and bookmarks should land on the page rather than a 404. */}
            <Route path="/hizmetler" element={<Navigate to="/guides" replace />} />
            <Route
              path="/hizmetler/:slug"
              element={<LegacyGuideRedirect />}
            />
            <Route path="/kurumsal" element={<Navigate to="/about" replace />} />
            <Route path="/projelerimiz" element={<Navigate to="/collections" replace />} />
            <Route path="/projelerimiz/:slug" element={<LegacyPrefixRedirect to="/collections" />} />
            <Route path="/neden-biz/:slug" element={<LegacyWhyUsRedirect />} />
            <Route path="/blog" element={<Navigate to="/recipes" replace />} />
            <Route path="/blog/:slug" element={<LegacyPrefixRedirect to="/recipes" />} />
            <Route path="/sss" element={<Navigate to="/faq" replace />} />
            <Route path="/kvkk" element={<Navigate to="/privacy" replace />} />
            <Route path="/iletisim" element={<Navigate to="/contact" replace />} />
            <Route path="/referanslar" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <div className="ai-button-ring fixed bottom-6 right-6 z-50 rounded-full p-0.5">
        <button
          onClick={() => openChat()}
          className="flex items-center gap-2.5 bg-[#357228] hover:bg-[#2d6124] text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg shadow-black/15 transition-all hover:scale-105"
        >
          <Bot size={18} />
          Need Cooking Help?
        </button>
      </div>
      {chatOpen && (
        <TeklifChatbot
          onClose={handleCloseChat}
          closing={chatClosing}
          messages={chatMessages}
          onMessagesChange={setChatMessages}
          sessionId={chatSessionId}
          prefill={chatPrefill}
        />
      )}
    </>
  );
}

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="projeler" element={<ProjelerAdmin />} />
            <Route path="projeler/yeni" element={<ProjeForm />} />
            <Route path="projeler/:id/duzenle" element={<ProjeForm />} />
            <Route path="blog" element={<BlogAdmin />} />
            <Route path="blog/yeni" element={<BlogForm />} />
            <Route path="blog/:id/duzenle" element={<BlogForm />} />
            <Route path="ai-kampanyalar" element={<AiCampaignsAdmin />} />
            <Route path="ai-kampanyalar/yeni" element={<AiCampaignForm />} />
            <Route path="ai-kampanyalar/:id" element={<AiCampaignDetail />} />
            <Route
              path="ai-kampanyalar/:id/duzenle"
              element={<AiCampaignForm />}
            />
            <Route path="ai-loglar" element={<AiLoglar />} />
            <Route path="sss" element={<SSSAdmin />} />
            <Route path="degerlendirmeler" element={<ChatDegerlendirme />} />
            <Route path="teklif-talepleri" element={<TeklifTalepleri />} />
            <Route path="loglar" element={<Loglar />} />
            <Route path="analitik" element={<Analitik />} />
            <Route path="guvenlik" element={<Guvenlik />} />
            <Route path="ads" element={<AdsAdmin />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/rnl-panel/*" element={<AdminRoutes />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<PageLoader fullScreen />}>
              <AdminGateway />
            </Suspense>
          }
        />
        <Route path="/*" element={<PublicLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
