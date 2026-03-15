import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Zap, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: number;
  originalPrice: number;
  period: string;
  features: string[];
  gradient: string;
  popular?: boolean;
}

interface SubscriptionPageProps {
  onBack?: () => void;
}

const SubscriptionPage = ({ onBack }: SubscriptionPageProps) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const plans: Plan[] = [
    {
      id: "weekly",
      name: "Weekly",
      icon: <Zap className="w-6 h-6" />,
      price: 0,
      originalPrice: 69,
      period: "week",
      features: [
        "Access to all features",
        "Priority support",
        "7-day room retention",
        "AI assistance",
      ],
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "monthly",
      name: "Monthly",
      icon: <Crown className="w-6 h-6" />,
      price: 0,
      originalPrice: 99,
      period: "month",
      features: [
        "All Weekly features",
        "30-day room retention",
        "Advanced AI features",
        "Custom themes",
        "Export & backup",
      ],
      gradient: "from-primary to-purple-500",
      popular: true,
    },
    {
      id: "yearly",
      name: "Yearly",
      icon: <Sparkles className="w-6 h-6" />,
      price: 0,
      originalPrice: 299,
      period: "year",
      features: [
        "All Monthly features",
        "Unlimited room retention",
        "Premium support",
        "Early access to features",
        "Priority processing",
        "Custom branding",
      ],
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  const handleSubscribe = async (planId: string) => {
    if (!isLoggedIn) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    setLoading(planId);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Update profile to set is_pro = true
      const { error } = await (supabase
        .from("profiles" as any)
        .update({ is_pro: true })
        .eq("id", user.id) as any);

      if (error) throw error;

      // Also store in localStorage as backup
      localStorage.setItem("is_pro", "true");
      localStorage.setItem("subscription_plan", planId);

      toast.success("🎉 Subscription activated! You're now a Pro member!");

      // Redirect to profile page
      navigate("/profile");
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error("Failed to activate subscription. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-background">
      {/* Header - Only show if not in a dialog (can check via props if needed, but for now just making it less intrusive) */}
      <div className="container mx-auto px-4 py-4">
        <Button
          variant="ghost"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              navigate(-1);
            }
          }}
          className="gap-2 sm:flex hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-4 md:py-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            100% OFF - Limited Time Offer!
          </span>
          <h1 className="text-2xl md:text-4xl font-bold mb-3 gradient-text">
            Choose Your Plan
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Unlock premium features and take your collaboration to the next level.
            All plans are <span className="text-primary font-semibold">FREE</span> for a limited time!
          </p>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl border p-5 flex flex-col ${plan.popular
                ? "border-primary bg-card/50 shadow-xl md:scale-105 z-10"
                : "border-border bg-card/30"
                } backdrop-blur-sm`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Icon */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}
              >
                {plan.icon}
              </div>

              {/* Plan Name */}
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    ₹{plan.price}
                  </span>
                  <span className="text-base line-through text-muted-foreground">
                    ₹{plan.originalPrice}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  per {plan.period}
                </span>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold">
                    100% OFF 🎉
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe Button */}
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className={`w-full h-11 text-sm font-semibold transition-all duration-300 ${plan.popular
                  ? "bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                  : "hover:bg-primary/5 active:scale-[0.98]"
                  }`}
                variant={plan.popular ? "default" : "outline"}
              >
                {loading === plan.id ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Processing...
                  </span>
                ) : (
                  "Get Started Free"
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Trust Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[10px] sm:text-xs text-muted-foreground mt-8 opacity-60"
        >
          🔒 Secure checkout • Cancel anytime • No credit card required
        </motion.p>
      </div>
    </div>
  );
};

export default SubscriptionPage;