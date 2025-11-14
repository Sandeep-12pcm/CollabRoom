import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { TrustSection } from "@/components/TrustSection";
import { Footer } from "@/components/Footer";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";
import LoadingScreen from "@/components/loading/LoadingScreen";
import AmbientBackground from "@/components/AmbientBackground";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initialization or fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust as needed
    return () => clearTimeout(timer);
  }, []);
  

  return (
    <div id="home" className="min-h-screen relative overflow-hidden">
      
      {/* AnimatePresence handles mount/unmount animations */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-50 bg-background"
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content fades in after loading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <Navbar />
        <main className="mt-10">
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <AmbientBackground />
            <Hero />
          </section>
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <AmbientBackground />
            <Features />
          </section>

          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4 text-foreground">
                  Start Collaborating Now
                </h2>
                <p className="text-muted-foreground text-lg">
                  Create a new room or join an existing one to start coding
                  together
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CreateRoomDialog />
                <JoinRoomDialog />
              </div>
            </div>
          </section>

          <TrustSection />
          {/* SUBSCRIPTION BUTTON + POPUP */}
          <SubscriptionDialog />
        </main>
        <Footer />
      </motion.div>
    </div>
  );
};

export default Index;
