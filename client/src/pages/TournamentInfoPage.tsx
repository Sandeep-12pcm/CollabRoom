import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  MapPin,
  Calendar,
  Clock,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  Navigation,
  ExternalLink,
  Star,
  Zap,
  Shield,
  Award,
  Gamepad2,
  ArrowRight,
  Info,
  Phone,
  Mail,
  Instagram,
  Youtube,
  AlertTriangle,
} from "lucide-react";

// ─── Tournament Data ────────────────────────────────────────────────────────
const TOURNAMENT_DATA = {
  name: "FFM LAN Tournament Faridabad",
  game: "Free Fire MAX",
  edition: "Season 1",
  status: "upcoming" as "upcoming" | "ongoing" | "completed",
  tagline: "Battle for Glory. Fight for Supremacy.",
  description:
    "Join the most electrifying Free Fire MAX tournament in the region! Compete against the best squads, show off your skills, and claim your share of the massive prize pool. Only the strongest team will rise to the top.",

  // Dates & Time
  registrationDeadline: "June 8, 2026",
  tournamentDate: "June 8, 2026",
  tournamentTime: "09:00 AM IST",
  registrationOpenDate: "June 1, 2026",

  // Venue
  venue: {
    name: "Z-Park, Sector-16, Faridabad",
    address: "",
    city: "Faridabad, Haryana",
    pincode: "121002",
    landmark: "Near Metro Heart Hospital",

    directionsUrl:
      "https://maps.app.goo.gl/QVchRoBF5ALd5kHZ6",

    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.448824743958!2d77.31963707549251!3d28.405710975789393!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cddad6949ce89%3A0x304792a7e8b02bb9!2sZ%20Park!5e0!3m2!1sen!2sin!4v1780131901750!5m2!1sen!2sin"
  },

  // Prize Pool
  totalPrizePool: "5,000 Diamonds",
  prizes: [
    { position: 1, label: "🥇 Champion", amount: "3,000 Diamonds", color: "gold" },
    { position: 2, label: "🥈 Runner-Up", amount: "1,000 Diamonds", color: "silver" },
    { position: 3, label: "🥉 Third Place", amount: "500 Diamonds", color: "bronze" },
    // { position: 4, label: "4th Place", amount: "₹3,000", color: "default" },
  ],
  bonusPrizes: [
    // { label: "Best Booyah", amount: "₹1,000" },
    { label: "MVP", amount: "500 Diamonds" },
  ],

  // Format
  format: {
    type: "BR Squad",
    totalTeams: 12,
    slotsLeft: 12,
    rounds: ["Bermuda", "NeXTera", "Kalahari"],
    matchType: "Battle Royale",
    map: "Bermuda",
    entryFee: "Free Entry",
  },

  // Schedule
  schedule: [
    {
      time: "4:50 PM",
      event: "Team Check-in & Verification",
      icon: <Users className="w-4 h-4" />,
    },
    {
      time: "5:10 PM",
      event: "Opening Ceremony",
      icon: <Star className="w-4 h-4" />,
    },
    {
      time: "5:20 PM",
      event: "Group Stage — Round 1",
      icon: <Gamepad2 className="w-4 h-4" />,
    },
    // {
    //   time: "1:00 PM",
    //   event: "Lunch Break",
    //   icon: <Clock className="w-4 h-4" />,
    // },
    {
      time: "5:40 PM",
      event: "Group Stage — Round 2",
      icon: <Gamepad2 className="w-4 h-4" />,
    },
    // {
    //   time: "5:00 PM",
    //   event: "Semi Finals",
    //   icon: <Zap className="w-4 h-4" />,
    // },
    {
      time: "6:00 PM",
      event: "Group Stage - Round 3",
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      time: "6:30 PM",
      event: "Prize Distribution & Closing",
      icon: <Award className="w-4 h-4" />,
    },
  ],

  // Rules highlights
  rules: [
    "4 players per squad (1 optional substitute)",
    "No emulators — mobile only",
    "Anti-cheat tools active during all matches",
    "Players must carry a valid photo ID",
    "Teams must be present 30 minutes before their match",
    "Decisions by the referee are final",
  ],

  // Contact
  contact: {
    phone: "+91 7303042793",
    email: "collabroomdevelopers@gmail.com",
    instagram: "@aigamerwala",
    youtube: "youtube.com/@aigamerwala",
  },

  // FAQs
  faqs: [
    {
      q: "Can I register as a solo player?",
      a: "No. This is a squad tournament. You must register as a complete team of 4 (or 4 + 1 substitute).",
    },
    {
      q: "What happens if our team can't attend on the day?",
      a: "Please notify us at least 48 hours in advance. Late cancellations may forfeit the entry fee.",
    },
    {
      q: "Is there an age restriction?",
      a: "Players must be at least 13 years old. Players under 18 require parental consent.",
    },
    {
      q: "Can we spectate the event without playing?",
      a: "Yes! The Grand Finals are open to spectators free of charge.",
    },
    {
      q: "Will the event be streamed online?",
      a: "Yes, the Semi-Finals and Grand Finals will be live-streamed on our YouTube channel.",
    },
  ],
};

// ─── Helper Components ───────────────────────────────────────────────────────

const StatBadge = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 bg-card/60 backdrop-blur border border-border/50 rounded-xl px-4 py-3 hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5">
    <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm text-foreground">{value}</p>
    </div>
  </div>
);

const PrizeTier = ({
  position,
  label,
  amount,
  color,
}: {
  position: number;
  label: string;
  amount: string;
  color: string;
}) => {
  const colorMap: Record<string, string> = {
    gold: "from-yellow-500/20 to-amber-400/10 border-yellow-400/40 shadow-yellow-400/10",
    silver: "from-slate-400/20 to-slate-300/10 border-slate-400/40 shadow-slate-400/10",
    bronze: "from-orange-700/20 to-orange-500/10 border-orange-600/40 shadow-orange-500/10",
    // default: "from-primary/10 to-primary/5 border-primary/20",
  };
  const textColorMap: Record<string, string> = {
    gold: "text-yellow-400",
    silver: "text-slate-300",
    bronze: "text-orange-500",
    // default: "text-primary",
  };

  return (
    <div
      className={`relative bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      {position === 1 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
          Top Prize
        </div>
      )}
      <p className="text-3xl font-extrabold text-center mb-1">{label}</p>
      <p
        className={`text-2xl font-bold text-center mt-2 ${textColorMap[color]}`}
      >
        {amount}
      </p>
    </div>
  );
};

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30">
      <button
        className="w-full flex justify-between items-center px-5 py-4 text-left bg-card/60 hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="font-medium text-sm pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-primary flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 py-4 text-sm text-muted-foreground border-t border-border/40 bg-muted/20 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
};

// ─── Registered Team Row Type ────────────────────────────────────────────────
type RegisteredTeam = {
  id: string | null;
  team_name: string | null;
  player1_ign: string | null;
  slot_number: number | null;
  created_at: string | null;
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const TournamentInfoPage = () => {
  const d = TOURNAMENT_DATA;

  // ── Real-time registrations ──
  const [registeredTeams, setRegisteredTeams] = useState<RegisteredTeam[]>([]);
  const [regLoading, setRegLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("tournament_registrations")
        .select("id, team_name, player1_ign, slot_number, created_at")
        .eq("status", "approved")
        .order("slot_number", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) {
        console.log("Error: " + error.message)
      }
      if (!data) setRegisteredTeams([])
      else setRegisteredTeams(data as RegisteredTeam[]);
      setRegLoading(false);
    };

    fetchTeams();

    // Real-time subscription
    const channel = supabase
      .channel("tournament_registrations_approved")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournament_registrations",
        },
        () => {
          // Re-fetch on any change so we always reflect current approved state
          fetchTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const approvedCount = registeredTeams.length;
  const slotsLeft = Math.max(0, d.format.totalTeams - approvedCount);
  const slotsPercent = Math.round((approvedCount / d.format.totalTeams) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`${d.name} — Tournament Info`}
        description={d.description}
      />
      <Navbar />

      {/* ── Registration Notice Banner ── */}
      {showNotice && (
        <div className="sticky top-16 z-40 w-full bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-start sm:items-center gap-3">
            <span className="flex-shrink-0 mt-0.5 sm:mt-0 text-amber-400 text-lg">📬</span>
            <p className="text-sm text-amber-200 leading-relaxed flex-1">
              <span className="font-bold text-amber-400">Already registered?</span>{" "}
              Please allow up to <span className="font-semibold">24 hours</span> to receive your confirmation email.
              If you haven't received it, make sure to check your{" "}
              <span className="font-extrabold text-amber-400 underline underline-offset-2 decoration-amber-400/60">
                spam / junk folder
              </span>
              .
            </p>
            <button
              aria-label="Dismiss notice"
              onClick={() => setShowNotice(false)}
              className="flex-shrink-0 text-amber-400/70 hover:text-amber-300 transition-colors p-1 rounded-lg hover:bg-amber-400/10"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative overflow-hidden pt-28 pb-20 px-4"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(243 75% 59%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: "hsl(173 80% 40%)" }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Registration Open
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3">
            <span className="gradient-text">{d.name}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2 font-medium">
            {d.game} &bull; {d.edition}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground italic mb-8 max-w-xl mx-auto">
            "{d.tagline}"
          </p>

          {/* Quick stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10">
            <StatBadge
              icon={<Calendar className="w-4 h-4" />}
              label="Tournament Date"
              value={d.tournamentDate}
            />
            <StatBadge
              icon={<Trophy className="w-4 h-4" />}
              label="Prize Pool"
              value={d.totalPrizePool}
            />
            <StatBadge
              icon={<Users className="w-4 h-4" />}
              label="Format"
              value={d.format.type}
            />
            <StatBadge
              icon={<MapPin className="w-4 h-4" />}
              label="Venue"
              value={d.venue.city}
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="gap-2 text-base px-8 bg-primary hover:bg-primary/90 shadow-lg glow-primary"
            >
              <Link to="/tournament/register">
                Register Now <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 text-base px-8"
            >
              <a href="#schedule">
                View Schedule <ChevronDown className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-grow">
        {/* ── About Section ── */}
        <section id="about" className="py-16 px-4 border-b border-border/40">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-primary" /> About the
                Tournament
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {d.description}
              </p>
              <div className="space-y-3">
                {[
                  { icon: <Target className="w-4 h-4" />, label: "Match Type", value: d.format.matchType },
                  { icon: <MapPin className="w-4 h-4" />, label: "Map", value: d.format.map },
                  { icon: <Zap className="w-4 h-4" />, label: "Entry Fee", value: d.format.entryFee },
                  { icon: <Users className="w-4 h-4" />, label: "Total Teams", value: `${d.format.totalTeams} Squads` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className="text-primary">{icon}</span>
                    <span className="text-muted-foreground w-28">{label}:</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slots Progress Card */}
            <div className="card-elevated p-6 rounded-2xl space-y-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Slot Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slots Filled</span>
                  <span className="font-bold text-primary">
                    {approvedCount} / {d.format.totalTeams}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${slotsPercent}%`,
                      background: "var(--gradient-primary)",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {regLoading ? "Loading..." : `${slotsLeft} slot${slotsLeft !== 1 ? "s" : ""} remaining`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: "Registration Closes", value: d.registrationDeadline },
                  { label: "Tournament Day", value: d.tournamentDate },
                  { label: "Start Time", value: d.tournamentTime },
                  { label: "Rounds", value: d.format.rounds.length.toString() },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-muted/40 rounded-xl p-3 border border-border/40"
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      {label}
                    </p>
                    <p className="font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <Button asChild className="w-full gap-2 mt-2">
                <Link to="/tournament/register">
                  Secure Your Slot <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Registered Teams ── */}
        <section id="teams" className="py-16 px-4 border-b border-border/40">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Registered Teams
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              {regLoading
                ? "Fetching approved teams..."
                : approvedCount === 0
                  ? "No teams approved yet. Be the first!"
                  : `${approvedCount} team${approvedCount !== 1 ? "s" : ""} approved — live updates enabled.`}
            </p>

            {regLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : approvedCount === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Registrations are open — slots filling up soon!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {registeredTeams.map((team, idx) => (
                  <div
                    key={team.id}
                    className="relative flex items-center gap-4 bg-card/60 backdrop-blur border border-border/50 rounded-2xl px-5 py-4 hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {/* Slot number badge */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm ${idx === 0
                        ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40"
                        : idx === 1
                          ? "bg-slate-400/20 text-slate-300 border border-slate-400/40"
                          : idx === 2
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                    >
                      {team.slot_number ?? idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{team.team_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {team.leader_name}
                      </p>
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-2 right-3 text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                        🥇 First
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Prize Pool ── */}
        <section
          id="prizes"
          className="py-16 px-4 border-b border-border/40"
          style={{ background: "var(--gradient-subtle)" }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 justify-center">
                <Trophy className="w-6 h-6 text-yellow-400" /> Prize Pool
              </h2>
              <p className="text-muted-foreground">
                Total Prize Pool:{" "}
                <span className="font-extrabold text-xl gradient-text">
                  {d.totalPrizePool}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {d.prizes.map((p) => (
                <PrizeTier key={p.position} {...p} />
              ))}
            </div>

            {/* Bonus prizes */}
            <div className="mt-6 border border-border/40 rounded-2xl p-5 bg-card/60">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <Star className="w-4 h-4 text-primary" /> Bonus Prizes
              </h3>
              <div className="flex flex-wrap gap-3">
                {d.bonusPrizes.map((bp) => (
                  <div
                    key={bp.label}
                    className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{bp.label}:</span>
                    <span className="font-bold text-primary">{bp.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Schedule ── */}
        <section id="schedule" className="py-16 px-4 border-b border-border/40">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> Day Schedule
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              {d.tournamentDate} &bull; All times are IST
            </p>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />

              <div className="space-y-4">
                {d.schedule.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 group"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0 w-11 h-11 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      {item.icon}
                    </div>
                    {/* Content */}
                    <div className="flex-1 bg-card/60 border border-border/40 rounded-xl px-4 py-3 group-hover:border-primary/30 transition-all duration-300 group-hover:-translate-y-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-sm">{item.event}</p>
                        <span className="text-xs font-mono text-primary bg-primary/10 rounded-md px-2 py-0.5 flex-shrink-0">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Format rounds */}
            <div className="mt-10 card-elevated rounded-2xl p-5">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">
                Tournament Bracket
              </h3>
              <div className="flex flex-wrap gap-2">
                {d.format.rounds.map((round, i) => (
                  <div key={round} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 text-xs font-semibold text-primary">
                      <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {round}
                    </div>
                    {i < d.format.rounds.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Venue & Map Directions ── */}
        <section
          id="venue"
          className="py-16 px-4 border-b border-border/40"
          style={{ background: "var(--gradient-subtle)" }}
        >
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" /> Venue & Directions
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              How to get to the tournament venue
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Venue Details */}
              <div className="space-y-4">
                <div className="card-elevated rounded-2xl p-5">
                  <h3 className="font-bold text-lg mb-4">{d.venue.name}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{d.venue.address}</p>
                        <p>{d.venue.city}</p>
                        <p className="font-mono text-muted-foreground">
                          PIN: {d.venue.pincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Navigation className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Landmark:{" "}
                        <span className="text-foreground font-medium">
                          {d.venue.landmark}
                        </span>
                      </p>
                    </div>
                  </div>

                  <a
                    id="get-directions-btn"
                    href={d.venue.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Travel Tips */}
                <div className="border border-border/40 rounded-2xl p-5 bg-card/60">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-primary" /> How to Reach
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 font-bold mt-0.5">🚇</span>
                      <span>
                        <strong className="text-foreground">Metro:</strong> Old Faridabad Metro Station — 10 min walk
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">🚌</span>
                      <span>
                        <strong className="text-foreground">Bus:</strong> Haryana Roadways 903 stop at Sector-16A/15 mod Mathura Road
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">🚗</span>
                      <span>
                        <strong className="text-foreground">Car/Cab:</strong> Parking is managed by Self
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">🛵</span>
                      <span>
                        <strong className="text-foreground">Two-wheeler:</strong> Parking managed by Self
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Embedded Map */}
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-lg min-h-[340px] bg-muted flex flex-col">
                <iframe
                  title="Tournament Venue Map"
                  src={d.venue.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  className="flex-1 min-h-[340px]"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="px-4 py-2 bg-card/80 backdrop-blur flex items-center justify-between gap-2 border-t border-border/40">
                  <p className="text-xs text-muted-foreground truncate">
                    {d.venue.name}
                  </p>
                  <a
                    href={d.venue.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0"
                  >
                    Open in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Rules ── */}
        <section id="rules" className="py-16 px-4 border-b border-border/40">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Rules & Guidelines
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Please read all rules carefully before registering.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {d.rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-card/60 border border-border/40 rounded-xl p-4 hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span className="text-primary font-bold text-sm flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  <p className="text-sm">{rule}</p>
                </div>
              ))}
            </div>

            {/* Warning note */}
            <div className="mt-6 flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm text-warning-foreground">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <p>
                <strong>Important:</strong> Any team found violating the rules
                will be immediately disqualified. Refunds will not be issued in
                such cases.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section
          id="faq"
          className="py-16 px-4 border-b border-border/40"
          style={{ background: "var(--gradient-subtle)" }}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" /> Frequently Asked
              Questions
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Got questions? We've got answers.
            </p>
            <div className="space-y-3">
              {d.faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Phone className="w-6 h-6 text-primary" /> Contact & Support
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Need help? Reach out through any of the channels below.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                {
                  icon: <Phone className="w-5 h-5" />,
                  label: "Phone",
                  value: d.contact.phone,
                  href: `tel:${d.contact.phone.replace(/\s/g, "")}`,
                  id: "contact-phone",
                },
                {
                  icon: <Mail className="w-5 h-5" />,
                  label: "Email",
                  value: d.contact.email,
                  href: `mailto:${d.contact.email}`,
                  id: "contact-email",
                },
                {
                  icon: <Instagram className="w-5 h-5" />,
                  label: "Instagram",
                  value: d.contact.instagram,
                  href: `https://instagram.com/${d.contact.instagram.replace("@", "")}`,
                  id: "contact-instagram",
                },
                {
                  icon: <Youtube className="w-5 h-5" />,
                  label: "YouTube",
                  value: "Watch Live",
                  href: `https://${d.contact.youtube}`,
                  id: "contact-youtube",
                },
              ].map((item) => (
                <a
                  key={item.id}
                  id={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-elevated rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {item.label}
                    </p>
                    <p className="font-semibold text-sm">{item.value}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Final CTA */}
            <div
              className="relative overflow-hidden rounded-3xl p-8 text-center"
              style={{ background: "var(--gradient-primary)" }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-20">
                <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-white blur-3xl" />
              </div>
              <div className="relative z-10">
                <Trophy className="w-10 h-10 text-white/90 mx-auto mb-3" />
                <h3 className="text-2xl font-extrabold text-white mb-2">
                  Ready to Dominate?
                </h3>
                <p className="text-white/80 mb-6 text-sm max-w-md mx-auto">
                  Slots are filling up fast. Register your team now before it's
                  too late!
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-bold gap-2 shadow-xl"
                  id="final-register-btn"
                >
                  <Link to="/tournament/register">
                    Register Your Team <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TournamentInfoPage;
