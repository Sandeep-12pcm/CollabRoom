import { Laptop, Users, GraduationCap, Lightbulb } from "lucide-react";

const USE_CASES = [
  {
    icon: Laptop,
    title: "Pair Programming",
    desc: "Work side-by-side with teammates no matter where they are.",
  },
  {
    icon: Users,
    title: "Team Brainstorming",
    desc: "Collaborate on ideas, snippets, and architecture notes.",
  },
  {
    icon: GraduationCap,
    title: "Learning & Teaching",
    desc: "Share examples with students or friends while explaining concepts.",
  },
  {
    icon: Lightbulb,
    title: "Debugging Together",
    desc: "Paste logs, reproduce bugs, and find solutions faster.",
  },
];

export const UseCases = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <h2 className="text-center text-4xl font-bold mb-4">
          Designed for Real Collaboration
        </h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-14">
          A simple shared space that adapts to how developers naturally think and work.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {USE_CASES.map((u, i) => (
            <div key={i} className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                <u.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{u.title}</h3>
              <p className="text-muted-foreground text-sm">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
