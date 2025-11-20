import { Shield, Zap, Users, Award } from "lucide-react";

const trustItems = [
  {
    icon: Shield,
    value: "99.9%",
    label: "Uptime"
  },
  {
    icon: Zap,
    value: "<50ms",
    label: "Latency"
  },
  {
    icon: Users,
    // value: "10k+",
    value: "Active",
    label: "Developers"
  },
  {
    icon: Award,
    value: "NaN",
    label: "Rating"
  }
];

export const TrustSection = () => {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(243_75%_59%/0.05),transparent_50%)]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Trusted by Developers
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secure, fast, and reliable. Built by developers, for developers.
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* {trustItems.map((item, index) => (
            <div 
              key={index}
              className="text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <item.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                {item.value}
              </div>
              <div className="text-muted-foreground">{item.label}</div>
            </div> */}

          {/* ))} */}
          This section Coming Soon ...
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            "CollabRoom has completely transformed how our team collaborates on code. 
            The real-time updates and clean interface make it indispensable."
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-primary" />
            <div className="text-left">
              <div className="font-semibold text-foreground">Harshal Soladhra</div>
              <div className="text-sm text-muted-foreground">Lead Developer at CollabRoom</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
