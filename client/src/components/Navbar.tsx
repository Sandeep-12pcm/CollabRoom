import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Code2, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { joinDemoRoom } from "@/utils/demoRoom";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-primary rounded-lg transition-transform duration-300 group-hover:scale-110">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DevRoom
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <button onClick={() => joinDemoRoom(navigate)}>
              <div
                className="text-foreground hover:text-primary transition-colors"
              >
                Demo Room
              </div>
            </button>
            {/* <Link
              to="#features"
              className="text-foreground hover:text-primary transition-colors"
            >
              Features
            </Link> */}
            <button
              onClick={() => {
                const section = document.getElementById("features");
                if (section) {
                  section.scrollIntoView({ behavior: "smooth" });
                } else {
                  // if user is on another route, go home first, then scroll
                  navigate("/");
                  setTimeout(() => {
                    const section = document.getElementById("features");
                    section?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }
              }}
            >
              Features
            </button>
            <ThemeToggle />
            {isLoggedIn ? (
              <Button
                variant="default"
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            ) : (
              <Button
                variant="default"
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/room/demo"
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo Room
              </Link>
              <Link
                to="#features"
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              {isLoggedIn ? (
                <Button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  variant="default"
                  className="bg-gradient-primary w-full"
                >
                  Log Out
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                  variant="default"
                  className="bg-gradient-primary w-full"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
