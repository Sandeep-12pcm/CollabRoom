import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { TrustSection } from "@/components/TrustSection";
import { Footer } from "@/components/Footer";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mt-10">
        <Hero />

        {/* Room Actions */}

        <Features />
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
