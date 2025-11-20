import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Room from "./pages/Room";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Loading from "./components/loading/Loading";
import { FeedbackForm } from "./pages/FeedbackForm";
import ProfilePage from "./pages/ProfilePage";
import ContactForm from "./pages/ContactForm";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Index />} />
          <Route path="/loading" element={<Loading />} />
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
);

export default App;
