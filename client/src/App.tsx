import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Room from "./pages/Room";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CommingSoon from "./components/loading/ComingSoon";
import { FeedbackForm } from "./pages/FeedbackForm";
import ProfilePage from "./pages/ProfilePage";
import ContactForm from "./pages/ContactForm";
import ComingSoon from "./components/loading/ComingSoon";
const queryClient = new QueryClient();

/**
 * Main App Component
 * 
 * Sets up providers (QueryClient, Tooltip, Toaster) and defines the application routes.
 */
const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Index />} />
            <Route path="/comingsoon" element={<ComingSoon />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/room/:id" element={<Room />} />
            <Route path="/feedback" element={< FeedbackForm />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/contact" element={<ContactForm/>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
