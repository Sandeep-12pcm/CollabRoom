import { motion } from "framer-motion";
import { Code2, Github, Twitter, Linkedin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdSlot } from "./AdSlot";

export const Footer = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Quick Links",
      items: [
        { label: "Home", action: () => navigate("/") },
        { label: "Create Room", action: () => navigate("/create") },
        { label: "Join Room", action: () => navigate("/join") },
        { label: "Pricing", action: () => navigate("/pricing") },
      ],
    },
    {
      title: "Product",
      items: [
        { label: "Real-time Collaboration", action: () => navigate("/features") },
        { label: "Multi-page Rooms", action: () => navigate("/features") },
        { label: "AI Assistant", action: () => navigate("/features") },
        { label: "Code Sharing", action: () => navigate("/features") },
      ],
    },
    {
      title: "Resources",
      items: [
        { label: "Documentation", action: () => navigate("/docs") },
        { label: "Help Center", action: () => navigate("/help") },
        { label: "FAQs", action: () => navigate("/faq") },
        { label: "Contact Support", action: () => navigate("/contact") },
      ],
    },
    {
      title: "Legal",
      items: [
        { label: "Privacy Policy", action: () => navigate("/privacy") },
        { label: "Terms of Service", action: () => navigate("/terms") },
      ],
    },
  ];

  const socialLinks = [
    { icon: Github, href: "https://github.com/Sandeep-12pcm" },
    { icon: Twitter, href: "https://x.com/Sandeep36701746" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/sandeep12pcm/" },
  ];

  return (
    <footer className="relative bg-background border-t border-border overflow-hidden font-mono">
      {/* === Ambient Background Glow === */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(96,165,250,0.25), transparent 50%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.2), transparent 50%)",
        }}
      />

      {/* === Animated Sweep Line === */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(147,197,253,0.07) 50%, transparent)",
        }}
      />

      {/* === Main Footer Content === */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 mb-10">
          {/* --- Brand --- */}
          <div className="space-y-4 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg"
              >
                <Code2 className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CollabRoom
              </span>
            </Link>

            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              A real-time collaborative workspace to code, share ideas, and build
              together — designed for developers and students.
            </p>

            <div className="flex gap-4 pt-3">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* --- Sections --- */}
          {sections.map(({ title, items }) => (
            <div key={title}>
              <h3 className="font-semibold mb-4 text-foreground tracking-wide uppercase text-xs">
                {title}
              </h3>
              <ul className="space-y-2 text-sm">
                {items.map(({ label, action }) => (
                  <li key={label}>
                    <button
                      onClick={action}
                      className="text-muted-foreground hover:text-primary transition-colors relative group w-full text-left"
                    >
                      {label}
                      <span className="absolute left-0 bottom-0 h-[1px] w-0 bg-primary group-hover:w-full transition-all duration-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* --- Footer Ad (Free Users Only via AdSlot logic) --- */}
        <div className="mb-10 w-full flex justify-center">
          <AdSlot size="medium" format="auto" slot="3938082210" />
        </div>

        {/* === Bottom Line === */}
        <div className="relative border-t border-border pt-6 mt-8 text-center text-muted-foreground text-sm">
          <motion.div
            initial={{ width: "10%" }}
            animate={{ width: ["10%", "80%", "10%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"
          />

          <p className="text-sm">
            © {new Date().getFullYear()}{" "}
            <span className="text-primary font-semibold">CollabRoom</span>. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
