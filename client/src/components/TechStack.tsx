import { Shield, Server, Code, Database } from "lucide-react";

const STACK = [
  { icon: Code, text: "React + Vite Frontend" },
  { icon: Server, text: "Node.js Backend" },
  { icon: Database, text: "Supabase Auth & DB" },
  { icon: Shield, text: "Secure HTTPS-by-default" },
];

export const TechStack = () => (
  <section className="py-24 bg-muted/50">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold mb-4">Built with Modern Tools</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-14">
        A lightweight stack focused on performance, privacy, and developer experience.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {STACK.map((item, idx) => (
          <div key={idx} className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full">
              <item.icon className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-medium">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
