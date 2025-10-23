import { Code2, Github, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                DevRoom
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Real-time code collaboration made simple and beautiful.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/Sandeep-12pcm" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://x.com/Sandeep36701746" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/in/sandeep12pcm/" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Product</h3>
            <ul className="space-y-2">
              <li><Link to="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Roadmap</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Changelog</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">About</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Security</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} DevRoom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
