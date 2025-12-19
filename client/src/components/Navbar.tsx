import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Code2, Menu, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { joinDemoRoom } from "@/utils/demoRoom";
import { useSubscription } from "@/hooks/useSubscription";
import { AdSlot } from "./AdSlot";

/**
 * Navbar Component
 * 
 * Displays the top navigation bar with logo, menu links, theme toggle, and user profile/auth buttons.
 * Handles mobile menu toggling and user session state.
 */
export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { isFree } = useSubscription();

  // Fetch session and profile info from Supabase on mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (session?.user) {
        // Fetch user's profile details
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, is_pro")
          .eq("id", session.user.id)
          .single();

        if (!error && data) setProfile(data);
      }
    };

    fetchUser();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) fetchUser();
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setProfile(null);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* === Logo === */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/nav_logo.png"
              alt="CollabRoom Logo"
              className="h-full w-28 object-contain"
            />
          </Link>

          {/* === Desktop Menu === */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => {
                const section = document.getElementById("home");
                if (section) section.scrollIntoView({ behavior: "smooth" });
                else {
                  navigate("/");
                  setTimeout(() => {
                    document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }
              }}
              className="text-foreground hover:text-primary transition-colors"
            >
              Home
            </button>

            <button onClick={() => joinDemoRoom(navigate)}>
              <div className="text-foreground hover:text-primary transition-colors">
                Demo Room
              </div>
            </button>

            <button
              onClick={() => {
                const section = document.getElementById("features");
                if (section) section.scrollIntoView({ behavior: "smooth" });
                else {
                  navigate("/");
                  setTimeout(() => {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }
              }}
              className="text-foreground hover:text-primary transition-colors"
            >
              Features
            </button>

            <Link
              to="/feedback"
              className="text-foreground hover:text-primary transition-colors"
            >
              Feedback
            </Link>

            {/* Desktop Only AdSlot */}
            <div className="hidden lg:block w-48">
              <AdSlot size="small" format="horizontal" />
            </div>

            <ThemeToggle />

            {/* === Conditional Profile / Auth Buttons === */}
            {isLoggedIn ? (
              <>
                {/* Profile Avatar */}
                <Link to="/profile" title="Profile">
                  <div
                    className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-transform duration-200 hover:scale-110 ${profile?.is_pro
                      ? "border-yellow-400 shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                      : "border-gray-500"
                      }`}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <User className="h-5 w-5 text-foreground/80" />
                      </div>
                    )}
                    {/* Crown for pro users */}
                    {profile?.is_pro && (
                      <div className="absolute -bottom-0.5 right-0 transform translate-x-1/2 translate-y-1/2 bg-gradient-to-br from-yellow-400 to-amber-500 p-[3px] rounded-full shadow" />
                    )}
                  </div>
                </Link>

                <Button
                  variant="default"
                  className="bg-gradient-primary hover:opacity-90 transition-opacity"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </>
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

          {/* === Mobile Menu === */}
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

        {/* === Mobile Menu Dropdown === */}
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

              <Link
                to="/feedback"
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Feedback
              </Link>

              <Link
                to="/contact"
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>

              {/* Profile option in mobile */}
              {isLoggedIn && (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
              )}

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
