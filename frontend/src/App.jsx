import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, lazy, Suspense, useState, useRef } from "react";
import { Bot, Utensils } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TeklifChatbot from "./components/TeklifChatbot";
import TeklifModal from "./components/TeklifModal";
import PageLoader from "./components/PageLoader";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import { usePageTransitionOverlay } from "./hooks/usePageTransitionOverlay";

const Home = lazy(() => import("./pages/Home"));
const Hizmetler = lazy(() => import("./pages/Hizmetler"));
const HizmetDetay = lazy(() => import("./pages/hizmetler/HizmetDetay"));
const Kurumsal = lazy(() => import("./pages/Kurumsal"));
const Referanslar = lazy(() => import("./pages/Referanslar"));
const Iletisim = lazy(() => import("./pages/Iletisim"));
const Projelerimiz = lazy(() => import("./pages/Projelerimiz"));
const ProjeDetay = lazy(() => import("./pages/projeler/ProjeDetay"));
const NedenBizDetay = lazy(() => import("./pages/neden-biz/NedenBizDetay"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetay = lazy(() => import("./pages/BlogDetay"));
const SSS = lazy(() => import("./pages/SSS"));
const Kvkk = lazy(() => import("./pages/Kvkk"));
const TasarrufHesaplayici = lazy(() => import("./pages/TasarrufHesaplayici"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminGateway = lazy(() => import("./pages/admin/AdminGateway"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ProjelerAdmin = lazy(() => import("./pages/admin/ProjelerAdmin"));
const ProjeForm = lazy(() => import("./pages/admin/ProjeForm"));
const ReferanslarAdmin = lazy(() => import("./pages/admin/ReferanslarAdmin"));
const ReferansForm = lazy(() => import("./pages/admin/ReferansForm"));
const BlogAdmin = lazy(() => import("./pages/admin/BlogAdmin"));
const BlogForm = lazy(() => import("./pages/admin/BlogForm"));
const SSSAdmin = lazy(() => import("./pages/admin/SSSAdmin"));
const ChatDegerlendirme = lazy(() => import("./pages/admin/ChatDegerlendirme"));
const TeklifTalepleri = lazy(() => import("./pages/admin/TeklifTalepleri"));
const Loglar = lazy(() => import("./pages/admin/Loglar"));
const Analitik = lazy(() => import("./pages/admin/Analitik"));
const Guvenlik = lazy(() => import("./pages/admin/Guvenlik"));
const AdsAdmin = lazy(() => import("./pages/admin/AdsAdmin"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }) {
  const { isAuth } = useAdminAuth();
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

  const [teklifOpen, setTeklifOpen] = useState(false);
  const [teklifClosing, setTeklifClosing] = useState(false);
  const closeChatTimerRef = useRef(null);
  const closeTeklifTimerRef = useRef(null);

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

  function openTeklif() {
    clearTimeout(closeTeklifTimerRef.current);
    setTeklifClosing(false);
    setTeklifOpen(true);
  }

  function handleCloseTeklif() {
    setTeklifClosing(true);
    closeTeklifTimerRef.current = setTimeout(() => {
      setTeklifOpen(false);
      setTeklifClosing(false);
    }, 220);
  }

  // Sayfa içi CTA'lar (örn. tasarruf hesaplayıcı) chatbot'u bu event ile açar
  useEffect(() => {
    const open = (e) => openChat(e.detail?.prefill || "");
    window.addEventListener("open-chat", open);
    return () => window.removeEventListener("open-chat", open);
  }, []);

  // Sayfa içi CTA'lar (örn. hizmet detay sayfaları) teklif modalını bu event ile açar
  useEffect(() => {
    window.addEventListener("open-teklif", openTeklif);
    return () => window.removeEventListener("open-teklif", openTeklif);
  }, []);

  return (
    <>
      <ScrollToTop />
      <PageLoader label="" fullScreen overlay show={showRouteOverlay} />
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader fullScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hizmetler" element={<Hizmetler />} />
            <Route path="/hizmetler/:slug" element={<HizmetDetay />} />
            <Route path="/kurumsal" element={<Kurumsal />} />
            <Route path="/projelerimiz" element={<Projelerimiz />} />
            <Route path="/projelerimiz/:slug" element={<ProjeDetay />} />
            <Route path="/neden-biz/:slug" element={<NedenBizDetay />} />
            <Route path="/referanslar" element={<Referanslar />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetay />} />
            <Route path="/sss" element={<SSS />} />
            <Route path="/kvkk" element={<Kvkk />} />
            <Route
              path="/tasarruf-hesaplayici"
              element={<TasarrufHesaplayici />}
            />
            <Route path="/iletisim" element={<Iletisim />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <button
        onClick={() => openTeklif()}
        className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg shadow-black/15 transition-all hover:scale-105"
      >
        <Utensils size={18} />
        Get A Recipe Plan
      </button>
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
      {teklifOpen && (
        <TeklifModal closing={teklifClosing} onClose={handleCloseTeklif} />
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
            <Route path="referanslar" element={<ReferanslarAdmin />} />
            <Route path="referanslar/yeni" element={<ReferansForm />} />
            <Route path="referanslar/:id/duzenle" element={<ReferansForm />} />
            <Route path="blog" element={<BlogAdmin />} />
            <Route path="blog/yeni" element={<BlogForm />} />
            <Route path="blog/:id/duzenle" element={<BlogForm />} />
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
