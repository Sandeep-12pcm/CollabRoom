// src/pages/Landing.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Navbar } from "@/components/Navbar";
import LoadingScreen from "@/components/loading/LoadingScreen";
import AmbientBackground from "@/components/AmbientBackground";
import { Footer } from "@/components/Footer";

// New honest sections (from the components we generated)
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { UseCases } from "@/components/UseCases";
import { WhyCollabRoom } from "@/components/WhyCollabRoom";
import { TechStack } from "@/components/TechStack";

// Optional dialogs you already use elsewhere (keeps behavior identical)
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";

import { SEO } from "@/components/SEO";
import { AdSlot } from "@/components/AdSlot";

const Landing: React.FC = () => {

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // small initialization delay to show your loading screen smoothly
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800); // tweak if needed
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      id="home"
      className="min-h-screen relative overflow-hidden bg-background"
    >
      <SEO
        title="Home"
        description="CollabRoom is a Real-time collaborative code sharing platform for developers. Create rooms, share code snippets, and collaborate with developers instantly."
      />
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0 z-50 bg-background"
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
      >
        <Navbar />

        <main className="mt-1">
          {/* HERO */}
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <AmbientBackground />
            <Hero />
          </section>

          {/* FEATURES */}
          <section className="relative">
            <Features />
          </section>

          {/* USE CASES */}
          <section className="relative">
            <UseCases />
          </section>

          {/* WHY COLLABROOM */}
          <section className="relative">
            <WhyCollabRoom />
          </section>

          {/* TECH STACK / SECURITY */}
          <section className="relative">
            <TechStack />
          </section>

          {/* FINAL CTA */}
          {/* <section className="relative"> */}
          {/* </section>  */}
          {/* Small interactive area for Create/Join buttons (keeps previous UX) */}
          <section className="py-20 text-center px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-4xl font-bold mb-6">
                Start Collaborating in Seconds
              </h2>

              <p className="text-muted-foreground">
                Want to try it now? Create a room or join the demo room — no
                sign up required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CreateRoomDialog />
                <JoinRoomDialog />
              </div>
            </div>
          </section>
          {/* Optional subscription / early access dialog */}
          <SubscriptionDialog />
        </main>

        {/* Ad Slot before Footer */}
        <div className="container mx-auto px-4 py-8">
          <AdSlot size="medium" format="horizontal" slot="7494183840" />
        </div>

        <Footer />

      </motion.div>
    </div>
  );
};

export default Landing;
