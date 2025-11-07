import { motion } from "framer-motion";
import { Code2, Github, Twitter, Linkedin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const Footer = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Product",
      items: ["Features", "Pricing", "Roadmap", "Changelog"],
    },
    {
      title: "Company",
      items: ["About", "Blog", "Careers", "Contact"],
    },
    {
      title: "Legal",
      items: ["Privacy", "Terms", "Security", "Cookies"],
    },
  ];

  const socialLinks = [
    { icon: Github, href: "https://github.com/Sandeep-12pcm" },
    { icon: Twitter, href: "https://x.com/Sandeep36701746" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/sandeep12pcm/" },
  ];

  const handleScroll = (sectionId: string) => {
    const section = document.getElementById(sectionId.toLowerCase());
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const homeSection = document.getElementById(sectionId.toLowerCase());
        homeSection?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  };

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

      {/* === Ambient Moving Glows === */}
      <motion.div
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute w-[400px] h-[400px] bg-primary/25 blur-3xl rounded-full top-1/3 left-1/4"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute w-[400px] h-[400px] bg-accent/25 blur-3xl rounded-full bottom-1/4 right-1/4"
      />

      {/* === Main Footer Content === */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* --- Brand --- */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg"
              >
                <Code2 className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                DevRoom
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Real-time collaborative coding environment. Connect. Build. Create.
            </p>

            <div className="flex gap-4 pt-3">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, rotate: 6, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* --- Quick Links --- */}
          {sections.map(({ title, items }) => (
            <div key={title}>
              <h3 className="font-semibold mb-4 text-foreground tracking-wide uppercase">
                {title}
              </h3>
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => handleScroll(item)}
                      className="text-muted-foreground hover:text-primary transition-colors relative group w-full text-left"
                    >
                      {item}
                      <span className="absolute left-0 bottom-0 h-[1px] w-0 bg-primary group-hover:w-full transition-all duration-300"></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* === Bottom Line === */}
        <div className="relative border-t border-border pt-6 mt-8 text-center text-muted-foreground text-sm">
          <motion.div
            initial={{ width: "10%" }}
            animate={{ width: ["10%", "80%", "10%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"
          />

          <div className="flex flex-col items-center justify-center gap-1">
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs font-mono text-muted-foreground"
            >
              &gt; Connection stable • syncing DevRoom workspace...
            </motion.p>
            <p className="text-sm text-foreground">
              © {new Date().getFullYear()}{" "}
              <span className="text-primary font-semibold">DevRoom</span>. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
