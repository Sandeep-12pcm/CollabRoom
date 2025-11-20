import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-illustration.png";
import { joinDemoRoom } from "@/utils/demoRoom";
import { useNavigate } from "react-router-dom";
import { CreateRoomDialog } from "./CreateRoomDialog";
export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(243_75%_59%/0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Real-time collaboration made simple
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Share Code Snippets
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Instantly
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl">
              Create rooms, collaborate in real-time, and share code snippets
              with your team. Built for developers who value speed and
              simplicity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <CreateRoomDialog>
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:opacity-90 transition-all duration-300 group w-full sm:w-auto"
                >
                  Create a Room
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CreateRoomDialog>

              <Button
                size="lg"
                variant="outline"
                className="border-primary/30 hover:bg-primary/10 w-full sm:w-auto"
                onClick={() => joinDemoRoom(navigate)}
              >
                Watch Demo
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in hidden lg:block">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <img
              src={heroImage}
              alt="Developers collaborating"
              className="relative z-10 rounded-2xl shadow-glow"
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
};
