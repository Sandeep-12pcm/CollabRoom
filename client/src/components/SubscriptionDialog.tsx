import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ComingSoon from "@/components/loading/ComingSoon";
import SubscriptionPage from "./SubscriptionPage";
export const SubscriptionDialog = () => {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [offer, setOffer] = useState(true);
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  // check auth state
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

  const handleSubscribe = () => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    navigate("/profile");
  };

  const plans = [
    {
      name: "Pro",
      icon: "👑",
      price: 499,
      original: 1999,
      features: [
        "🚀 Faster Room Performance",
        "⏳ 72-hour Room Retention",
        "👥 Join up to 10 Active Rooms",
        "🤖 Smart AI Help (Basic)",
        "🎨 Custom Profile Themes",
      ],
      gradient: "from-yellow-400 to-amber-500",
    },
    {
      name: "Premium",
      icon: "🌟",
      price: 899,
      original: 3999,
      features: [
        "🔥 Ultra Room Performance",
        "🗂️ 1-Month Room Retention",
        "♾ Unlimited Rooms",
        "🤖 Full Power AI Assistance",
        "💾 Export & Backup Rooms",
        "✨ Premium Motion UI",
      ],
      gradient: "from-purple-400 to-fuchsia-500",
    },
  ];

  return (
    <>
      {/* CENTER GOLDEN GLOW BUTTON */}
      <div className="flex justify-center mt-12 mb-20">
        <motion.button
          onClick={() => {
            setOpen(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative px-10 py-4 text-lg font-bold rounded-2xl text-black bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all duration-300"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Glowing border */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-yellow-200/50 pointer-events-none"
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />

          <span className="relative z-10 flex items-center gap-2">
            <Sparkles className="w-5 h-5 animate-pulse" />
            Upgrade to Pro
          </span>
        </motion.button>
      </div>

      {/* POPUP DIALOG */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dialog Box */}
            <motion.div
              className="relative bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto no-scrollbar"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {comingSoon ? (
                // 👉 Show Coming Soon inside modal
                <div className="w-full h-full relative p-6 sm:p-10">
                  <ComingSoon />

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setComingSoon(false);
                      setOpen(false);
                    }}
                    className="absolute top-6 right-6 p-2 rounded-full bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                // 👉 Main subscription UI
                offer ? (
                  <div className="relative">
                    {/* Close Button for SubscriptionPage view */}
                    <button
                      onClick={() => {
                        setOpen(false);
                      }}
                      className="absolute top-6 right-6 z-50 p-2 rounded-full bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <SubscriptionPage onBack={() => setOpen(false)} />
                  </div>
                ) : (
                  <div className="p-6 sm:p-10">
                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setOpen(false);
                        setComingSoon(false);
                      }}
                      className="absolute top-6 right-6 p-2 rounded-full bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-10">
                      <h2 className="text-3xl sm:text-4xl font-black mb-3 text-foreground tracking-tight">
                        Choose Your Plan
                      </h2>
                      <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                        Upgrade now and unlock premium CollabRoom features.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {plans.map((plan, index) => (
                        <motion.div
                          key={index}
                          className="rounded-2xl p-6 sm:p-8 border border-white/10 bg-card/40 backdrop-blur-sm shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden group"
                          whileHover={{ y: -5 }}
                        >
                          {/* Decorative Glow */}
                          <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${plan.gradient} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

                          {/* Plan Icon */}
                          <div
                            className={`w-14 h-14 mb-6 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${plan.gradient} shadow-lg ring-4 ring-background/50`}
                          >
                            {plan.icon}
                          </div>

                          {/* Plan Name */}
                          <h3 className="text-xl font-bold mb-2 text-foreground">
                            {plan.name} Plan
                          </h3>

                          {/* Price */}
                          <div className="mb-6">
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-black text-primary">
                                ₹{plan.price}
                              </span>
                              <span className="text-lg line-through text-muted-foreground font-medium">
                                ₹{plan.original}
                              </span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider">
                              Save{" "}
                              {Math.round(
                                ((plan.original - plan.price) / plan.original) *
                                100
                              )}
                              % 🎉
                            </div>
                          </div>

                          {/* Features */}
                          <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          {/* SUBSCRIBE BUTTON */}
                          <button
                            onClick={handleSubscribe}
                            className={`w-full py-4 rounded-xl bg-gradient-to-r ${plan.gradient} text-white font-bold text-sm shadow-lg hover:shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all`}
                          >
                            Subscribe Now
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

