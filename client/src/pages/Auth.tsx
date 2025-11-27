import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Code2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // ✅ 1. Check session & sync profile for OAuth users
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) navigate("/");
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const user = session.user;
        const displayName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.user_name ||
          "Developer";

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          try {
            await supabase.from("profiles").insert({
              id: user.id,
              email: user.email,
              display_name: displayName,
              avatar_url:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                null,
              created_at: new Date(),
            });
          } catch (error) {
            console.error("Error creating profile:", error);
          }
        } else {
          await supabase
            .from("profiles")
            .update({
              display_name: displayName,
              avatar_url:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                null,
            })
            .eq("id", user.id);
        }

        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ✅ 2. Email/Password Auth
  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "Signed in successfully.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Check your email to confirm your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. Supabase Google OAuth
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) console.error("Google login error:", error);
  };

  // ✅ 4. Supabase GitHub OAuth
  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) console.error("GitHub login error:", error);
  };

  // ✅ 5. OAuth Button Components
  const GoogleButton = () => (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md py-2 hover:bg-gray-50 transition"
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google Logo"
        className="w-5 h-5"
      />
      <span className="text-gray-700 font-medium">Sign in with Google</span>
    </button>
  );

  const GithubButton = () => (
    <button
      onClick={handleGithubLogin}
      className="w-full flex items-center justify-center gap-3 bg-[#24292f] text-white rounded-md py-2 hover:bg-[#1f2428] transition"
    >
      <img
        src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
        alt="GitHub Logo"
        className="w-5 h-5 invert"
      />
      <span className="font-medium">Sign in with GitHub</span>
    </button>
  );

  // ✅ 6. Render UI
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div >
            {/* <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-2"> */}
              {/* <Code2 className="h-6 w-6 text-primary-foreground" />
               */}
              <img
                src="/nav_collavroom.png"
                alt="CollabRoom Logo"
                className="h-full w-28 object-contain"
              />
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your account"
                : "Sign up to start collaborating"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-muted"></div>
              <span className="mx-3 text-muted-foreground text-sm">or</span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            <div className="space-y-3">
              <GoogleButton />
              <GithubButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
