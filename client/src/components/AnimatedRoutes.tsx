import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import LoadingScreen from "./loading/LoadingScreen";

// Lazy load pages for code splitting
const Index = lazy(() => import("../pages/Index"));
const Room = lazy(() => import("../pages/Room"));
const Auth = lazy(() => import("../pages/Auth"));
const NotFound = lazy(() => import("../pages/NotFound"));
const FeedbackForm = lazy(() => import("../pages/FeedbackForm").then(m => ({ default: m.FeedbackForm })));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const ContactForm = lazy(() => import("../pages/ContactForm"));
const ComingSoon = lazy(() => import("./loading/ComingSoon"));
const TempTournamentPage = lazy(() => import("../pages/TempTournamentPage"));
const TempTournamentPageWithPayment = lazy(() => import("../pages/TempTournamentPageWithPayment"));
const TournamentAdminPage = lazy(() => import("../pages/TournamentAdminPage"));
const SubscriptionPage = lazy(() => import("../pages/SubscriptionPage"));

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/home" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/comingsoon" element={<PageTransition><ComingSoon /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
          <Route path="/room/:id" element={<PageTransition><Room /></PageTransition>} />
          <Route path="/feedback" element={<PageTransition><FeedbackForm /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><ContactForm /></PageTransition>} />
          <Route path="/subscription" element={<PageTransition><SubscriptionPage /></PageTransition>} />
          <Route path="/tournament/register" element={<PageTransition><TempTournamentPage /></PageTransition>} />
          <Route path="/tournament/register-with-payment" element={<PageTransition><TempTournamentPageWithPayment /></PageTransition>} />
          <Route path="/tournament/admin" element={<PageTransition><TournamentAdminPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};
