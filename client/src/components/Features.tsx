import { Code2, Copy, FolderPlus, Share2, Lock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: FolderPlus,
    title: "Create Rooms",
    description: "Instantly create collaborative spaces for your team to share and work on code together.",
    color: "text-primary"
  },
  {
    icon: Code2,
    title: "Add Pages",
    description: "Organize your code snippets across multiple pages within each room for better structure.",
    color: "text-accent"
  },
  {
    icon: Share2,
    title: "Share Code",
    description: "Real-time code sharing with syntax highlighting for over 100 programming languages.",
    color: "text-success"
  },
  {
    icon: Copy,
    title: "Copy Instantly",
    description: "One-click copy to clipboard with visual feedback. Share code faster than ever.",
    color: "text-primary"
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your code is encrypted and secure. Create private rooms for sensitive projects.",
    color: "text-accent"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for speed. Real-time updates with zero lag, even with multiple collaborators.",
    color: "text-success"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Collaborate Efficiently
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with developers in mind. Fast, secure, and incredibly easy to use.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 bg-card hover:shadow-glow transition-all duration-300 border-border hover:border-primary/30 group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`mb-4 ${feature.color}`}>
                <feature.icon className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
