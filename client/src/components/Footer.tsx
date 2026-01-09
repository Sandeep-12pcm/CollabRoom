import { motion } from "framer-motion";
import { Code2, Github, Twitter, Linkedin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const Footer = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Quick Links",
      items: [
        { label: "Home", action: () => navigate("/") },
        { label: "Create Room", action: () => navigate("/create") },
        { label: "Join Room", action: () => navigate("/join") },
      ],
    },
    {
      title: "Product",
      items: [
        { label: "Real-time Collaboration", action: () => navigate("/features") },
        { label: "AI Assistant", action: () => navigate("/features") },
        { label: "Code Sharing", action: () => navigate("/features") },
      ],
    },
    {
      title: "Resources",
      items: [
        { label: "Documentation", action: () => navigate("/docs") },
        { label: "Help Center", action: () => navigate("/help") },
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
    { icon: Github, href: "https://github.com/Sandeep-12pcm", label: "GitHub" },
    { icon: Twitter, href: "https://x.com/Sandeep36701746", label: "Twitter" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/sandeep12pcm/", label: "LinkedIn" },
  ];

  return (
    <footer className="relative bg-card/50 border-t border-border backdrop-blur-sm">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors"
              >
                <Code2 className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="text-lg font-semibold text-foreground">
                CollabRoom
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Real-time collaborative workspace for developers. Code, share, and build together.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation Sections */}
          {sections.map(({ title, items }) => (
            <div key={title} className="space-y-3">
              <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">
                {title}
              </h3>
              <ul className="space-y-2">
                {items.map(({ label, action }) => (
                  <li key={label}>
                    <button
                      onClick={action}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 text-left"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-12 pt-6 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} CollabRoom. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with ❤️ for developers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
