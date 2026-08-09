import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import freefireBg from "@/assets/freefire_3d_bg.png";
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
  Calculator,
  Crosshair,
  Flame,
  Loader2,
} from "lucide-react";

// ─── Tournament Data ────────────────────────────────────────────────────────
const TOURNAMENT_DATA = {
  name: "FFM LAN Tournament Faridabad",
  game: "Free Fire MAX",
  edition: "Season 2",
  status: "upcoming" as "upcoming" | "ongoing" | "completed",
  tagline: "Battle for Glory. Fight for Supremacy.",
  description:
    "Join the most electrifying Free Fire MAX tournament in the region! Compete against the best squads, show off your skills, and claim your share of the massive prize pool. Only the strongest team will rise to the top.",

  // Dates & Time
  registrationDeadline: "August 22, 2026",
  tournamentDate: "August 23, 2026",
  tournamentTime: "02:00 PM IST",
  registrationOpenDate: "August 10, 2026",

  // Venue
  venue: {
    name: "Town Park, Sector-12, Faridabad",
    address: "Sector 12, Town Park, Faridabad",
    city: "Faridabad, Haryana",
    pincode: "121007",
    landmark: "Near Bata Chowk Metro Station",

    directionsUrl: "https://maps.app.goo.gl/fkwBn2k2tG9f4WoL6",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28082.462364513856!2d77.31594187360878!3d28.37977003282714!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdc5cfcab97dd%3A0x8ede6ed94f20497f!2sTown%20Park%20Trail%2C%20Sector%2012%2C%20Faridabad%2C%20Haryana%20121007!5e0!3m2!1sen!2sin!4v1786181892726!5m2!1sen!2sin",

    //  width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
  },

  // Prize Pool
  totalPrizePool: "Upto 10,000 Diamonds",
  prizes: [
    { position: 1, label: "🥇 1st Place", amount: "Upto 5,000 Diamonds", color: "gold" },
    { position: 2, label: "🥈 2nd Place", amount: "Upto 3,000 Diamonds", color: "silver" },
    { position: 3, label: "🥉 3rd Place", amount: "Upto 2,000 Diamonds", color: "bronze" },
  ],
  bonusPrizes: [],

  // Format
  format: {
    type: "BR Squad",
    totalTeams: 48,
    slotsLeft: 48,
    rounds: ["Bermuda"],
    matchType: "Battle Royale",
    map: "Bermuda",
    entryFee: "40 Rs. Commitment Charge.",
  },

  // Schedule
  schedule: [
    {
      time: "16 Aug",
      event: "Practice Match (Online Mode)",
      icon: <Gamepad2 className="w-4 h-4" />,
    },
    {
      time: "23 Aug — 12:00 PM",
      event: "Online Qualifiers Day 1",
      icon: <Users className="w-4 h-4" />,
    },
    {
      time: "30 Aug",
      event: "Online Qualifiers Day 2 or LAN (Depending upon registrations, final decision communicated later)",
      icon: <Star className="w-4 h-4" />,
    },
    {
      time: "6 Sept",
      event: "LAN Match (If not played on 30 August)",
      icon: <Trophy className="w-4 h-4" />,
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
    youtube: "https://youtu.be/2YZD7ygGiIU",
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

  // Points Table
  pointsTable: [
    { rank: 1, points: 12 },
    { rank: 2, points: 9 },
    { rank: 3, points: 8 },
    { rank: 4, points: 7 },
    { rank: 5, points: 6 },
    { rank: 6, points: 5 },
    { rank: 7, points: 4 },
    { rank: 8, points: 3 },
    { rank: 9, points: 2 },
    { rank: 10, points: 1 },
    { rank: 11, points: 0 },
    { rank: 12, points: 0 },
  ],
  killPoints: 1,
};

// ─── Deadline Helpers ────────────────────────────────────────────────────────
const getDaysUntil = (dateStr: string): number => {
  const deadline = new Date(dateStr);
  deadline.setHours(23, 59, 59, 999);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
  <div className="flex items-center gap-3.5 ff-3d-card ff-hud-corner rounded-xl px-4 py-3.5 shadow-xl">
    <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex-shrink-0 shadow-inner">
      {icon}
    </div>
    <div>
      <p className="text-[11px] text-amber-400/80 font-bold uppercase tracking-wider">{label}</p>
      <p className="font-black text-sm sm:text-base text-white tracking-wide">{value}</p>
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
    gold: "from-amber-950/90 via-amber-900/50 to-slate-950 border-amber-400/80 shadow-amber-500/30",
    silver: "from-slate-800/90 via-slate-900 to-slate-950 border-slate-300/70 shadow-slate-400/30",
    bronze: "from-orange-950/90 via-amber-950/50 to-slate-950 border-orange-500/80 shadow-orange-500/30",
  };
  const textColorMap: Record<string, string> = {
    gold: "text-amber-300 drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)]",
    silver: "text-slate-100 drop-shadow-[0_4px_12px_rgba(203,213,225,0.6)]",
    bronze: "text-orange-400 drop-shadow-[0_4px_12px_rgba(249,115,22,0.6)]",
  };

  return (
    <div
      className={`relative bg-gradient-to-br ${colorMap[color]} border-2 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] ff-hud-corner`}
    >
      {position === 1 && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-black text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg border border-amber-300">
          CHAMPION PRIZE
        </div>
      )}
      <p className="text-xl md:text-3xl font-black text-center mb-1 text-white uppercase tracking-wider">{label}</p>
      <p
        className={`text-xl md:text-3xl font-black text-center mt-2 ${textColorMap[color]}`}
      >
        {amount}
      </p>
    </div>
  );
};

const PointsCalculator = () => {
  const [rank, setRank] = useState<number | "">("");
  const [kills, setKills] = useState<number | "">("");

  const rankPoints =
    rank !== "" && rank >= 1 && rank <= 12
      ? (TOURNAMENT_DATA.pointsTable[rank - 1]?.points ?? 0)
      : null;
  const killPts = kills !== "" && kills >= 0 ? Number(kills) * TOURNAMENT_DATA.killPoints : null;
  const total =
    rankPoints !== null && killPts !== null ? rankPoints + killPts : null;

  const rankLabel =
    rank !== "" && rank >= 1 && rank <= 12 ? `#${rank}` : null;

  const resultColor =
    total === null
      ? ""
      : total >= 10
        ? "text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]"
        : total >= 6
          ? "text-orange-400"
          : "text-slate-300";

  return (
    <div className="ff-3d-card ff-hud-corner rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Rank input */}
        <div className="space-y-2">
          <label
            htmlFor="calc-rank"
            className="text-xs text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5"
          >
            <Trophy className="h-3.5 w-3.5" />
            Finish Rank (1–12)
          </label>
          <input
            id="calc-rank"
            type="number"
            min={1}
            max={12}
            placeholder="e.g. 1"
            value={rank}
            onChange={(e) => {
              const v = e.target.value;
              setRank(v === "" ? "" : Math.min(12, Math.max(1, parseInt(v) || 1)));
            }}
            className="ff-input w-full rounded-xl px-4 py-3 text-base font-bold text-white placeholder:text-slate-500"
          />
        </div>

        {/* Kills input */}
        <div className="space-y-2">
          <label
            htmlFor="calc-kills"
            className="text-xs text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Total Kills
          </label>
          <input
            id="calc-kills"
            type="number"
            min={0}
            placeholder="e.g. 5"
            value={kills}
            onChange={(e) => {
              const v = e.target.value;
              setKills(v === "" ? "" : Math.max(0, parseInt(v) || 0));
            }}
            className="ff-input w-full rounded-xl px-4 py-3 text-base font-bold text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Result */}
      {total !== null ? (
        <div className="rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 p-6 shadow-inner">
          <div className="flex flex-wrap justify-between gap-4 text-sm mb-4">
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-amber-400/80 text-xs uppercase font-extrabold tracking-wider mb-1">Rank</p>
              <p className="font-black text-white text-xl">{rankLabel}</p>
            </div>
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-amber-400/80 text-xs uppercase font-extrabold tracking-wider mb-1">Rank Pts</p>
              <p className="font-black text-amber-300 text-xl">{rankPoints}</p>
            </div>
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-amber-400/80 text-xs uppercase font-extrabold tracking-wider mb-1">Kill Pts</p>
              <p className="font-black text-amber-300 text-xl">{killPts}</p>
            </div>
            <div className="text-center flex-1 min-w-[80px] border-l border-amber-500/30 pl-4">
              <p className="text-amber-400/80 text-xs uppercase font-extrabold tracking-wider mb-1">Total Score</p>
              <p className={`font-black text-3xl ${resultColor}`}>{total}</p>
            </div>
          </div>
          <p className="text-center text-xs text-slate-300 font-medium">
            {rankPoints} (rank) + {kills} kill{Number(kills) !== 1 ? "s" : ""} × {TOURNAMENT_DATA.killPoints} pt = <span className={`font-black ${resultColor}`}>{total} pts</span>
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/20 bg-slate-950/60 p-5 text-center text-slate-400 text-sm font-medium">
          Enter finish rank and kills above to calculate live match score.
        </div>
      )}
    </div>
  );
};

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="ff-3d-card rounded-xl overflow-hidden transition-all duration-300 border-amber-500/30">
      <button
        className="w-full flex justify-between items-center px-5 py-4 text-left bg-slate-900/60 hover:bg-amber-500/10 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="font-extrabold text-sm sm:text-base pr-4 text-slate-100">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-amber-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 py-4 text-sm text-slate-300 border-t border-amber-500/20 bg-slate-950/60 leading-relaxed">
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
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("tournament_registrations")
        .select("id, team_name, player1_ign, slot_number, created_at")
        .eq("status", "approved")
        .eq("tournament_code", "lan_season_2")
        .order("slot_number", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.log("Error: " + error.message);
      }
      if (!data) setRegisteredTeams([]);
      else setRegisteredTeams(data as RegisteredTeam[]);
      setRegLoading(false);
    };

    fetchTeams();

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
    <div className="relative min-h-screen ff-gaming-bg text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black overflow-x-hidden">
      <SEO
        title={`${d.name} — Tournament Info`}
        description={d.description}
      />

      {/* ── 3D Gaming Environment Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={freefireBg}
          alt="Free Fire MAX 3D Arena Background"
          className="w-full h-full object-cover opacity-25 filter contrast-125 brightness-90 mix-blend-luminosity scale-105"
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-amber-500/25 via-orange-600/10 to-transparent blur-3xl opacity-75 animate-pulse pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-red-600/20 blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-amber-400/20 blur-3xl opacity-60 pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* ── Registration Notice Banner ── */}
        {showNotice && (
          <div className="sticky top-16 z-40 w-full bg-amber-950/85 border-b border-amber-500/40 backdrop-blur-md shadow-xl">
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

        {/* ── Hero Section ── */}
        <section
          id="hero"
          className="relative overflow-hidden pt-28 pb-20 px-4"
        >
          <div className="relative max-w-5xl mx-auto text-center">

            {/* 3D Top Badge */}
            <div className="inline-flex items-center gap-2 ff-badge px-5 py-2 rounded-full mb-6 shadow-xl border border-amber-400/60">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
                FREE FIRE MAX BATTLEGROUNDS • FARIDABAD
              </span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-wider uppercase mb-4 drop-shadow-2xl">
              <span className="ff-3d-title">{d.name}</span>
            </h1>

            <p className="text-lg sm:text-2xl text-amber-300 font-extrabold uppercase tracking-wide mb-3">
              {d.game} &bull; {d.edition}
            </p>
            <p className="text-sm sm:text-base text-slate-300 italic mb-10 max-w-2xl mx-auto font-medium">
              "{d.tagline}"
            </p>

            {/* Quick stat grid (3D Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
              <StatBadge
                icon={<Calendar className="w-5 h-5 text-amber-400" />}
                label="Qualifier's Day"
                value={d.tournamentDate}
              />
              <StatBadge
                icon={<Trophy className="w-5 h-5 text-amber-400" />}
                label="Prize Pool"
                value={d.totalPrizePool}
              />
              <StatBadge
                icon={<Users className="w-5 h-5 text-amber-400" />}
                label="Format"
                value={d.format.type}
              />
              <StatBadge
                icon={<MapPin className="w-5 h-5 text-amber-400" />}
                label="Venue"
                value={d.venue.city}
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="ff-button text-base sm:text-lg px-10 py-7 uppercase font-black tracking-wider shadow-2xl"
              >
                <Link to="/tournament/register-with-payment">
                  Register Squad Now <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 hover:text-white font-bold"
              >
                <a href="#schedule">
                  View Schedule <ChevronDown className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <main className="flex-grow">

          {/* ── About Section ── */}
          <section id="about" className="py-16 px-4 border-b border-amber-500/20">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide flex items-center gap-3 text-amber-400">
                  <Gamepad2 className="w-7 h-7 text-amber-400" /> About Tournament
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm sm:text-base font-medium">
                  {d.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { icon: <Target className="w-4 h-4 text-amber-400" />, label: "Match Type", value: d.format.matchType },
                    { icon: <MapPin className="w-4 h-4 text-amber-400" />, label: "Map", value: d.format.map },
                    { icon: <Zap className="w-4 h-4 text-amber-400" />, label: "Entry Fee", value: d.format.entryFee },
                    { icon: <Users className="w-4 h-4 text-amber-400" />, label: "Total Teams", value: `${d.format.totalTeams} Squads` },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 text-sm ff-3d-card p-3 rounded-xl border-amber-500/20">
                      <span>{icon}</span>
                      <span className="text-slate-400 text-xs uppercase font-bold">{label}:</span>
                      <span className="font-extrabold text-white ml-auto">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slots Progress Card (3D) */}
              <div className="ff-3d-card ff-hud-corner p-6 rounded-2xl space-y-5">
                <h3 className="font-black text-lg uppercase tracking-wider flex items-center gap-2 text-amber-400">
                  <Shield className="w-5 h-5 text-amber-400" /> Battleground Slot Status
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase text-xs">Approved Squads</span>
                    <span className="font-black text-amber-400">
                      {approvedCount} / {d.format.totalTeams}
                    </span>
                  </div>
                  <div className="h-3.5 bg-slate-950 rounded-full overflow-hidden border border-amber-500/30 p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                      style={{ width: `${slotsPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-amber-300 font-bold text-right">
                    {regLoading ? "Loading..." : `${slotsLeft} slot${slotsLeft !== 1 ? "s" : ""} remaining`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {(() => {
                    const daysLeft = getDaysUntil(d.registrationDeadline);
                    const isUrgent = daysLeft >= 0 && daysLeft <= 3;
                    const items = [
                      { label: "Registration Closes", value: d.registrationDeadline, urgent: isUrgent, daysLeft },
                      { label: "Tournament Day", value: d.tournamentDate, urgent: false, daysLeft: 0 },
                      { label: "Start Time", value: d.tournamentTime, urgent: false, daysLeft: 0 },
                      { label: "Rounds", value: d.format.rounds.length.toString(), urgent: false, daysLeft: 0 },
                    ];
                    return items.map(({ label, value, urgent, daysLeft: dl }) => (
                      <div
                        key={label}
                        className={`rounded-xl p-3 border transition-all duration-300 ${urgent
                          ? "bg-red-950/60 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.35)]"
                          : "bg-slate-900/60 border-amber-500/20"
                          }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <p className={`text-[10px] uppercase tracking-wider font-extrabold ${urgent ? "text-red-400" : "text-slate-400"}`}>
                            {label}
                          </p>
                          {urgent && (
                            <span className="text-[8px] font-black text-red-400 bg-red-500/20 border border-red-500/40 rounded-full px-1.5 py-0.5 uppercase tracking-wider leading-none animate-pulse">
                              ⚠ {dl === 0 ? "Today!" : dl === 1 ? "Tomorrow!" : `${dl}d left!`}
                            </span>
                          )}
                        </div>
                        <p className={`font-extrabold text-sm ${urgent ? "text-red-400" : "text-white"}`}>{value}</p>
                      </div>
                    ));
                  })()}
                </div>

                <Button asChild className="ff-button w-full text-base font-extrabold tracking-wider py-6 mt-2">
                  <Link to="/tournament/register-with-payment">
                    Secure Your Squad Slot <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* ── Registered Teams ── */}
          <section id="teams" className="py-16 px-4 border-b border-amber-500/20">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide mb-2 flex items-center gap-3 text-amber-400">
                <Users className="w-7 h-7 text-amber-400" /> Confirmed Squads
              </h2>
              <p className="text-slate-300 mb-8 text-sm font-medium">
                {regLoading
                  ? "Fetching approved teams..."
                  : approvedCount === 0
                    ? "No teams approved yet. Be the first!"
                    : `${approvedCount} squad${approvedCount !== 1 ? "s" : ""} approved — live sync enabled.`}
              </p>

              {regLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                </div>
              ) : approvedCount === 0 ? (
                <div className="text-center py-16 text-slate-400 ff-3d-card rounded-2xl">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-amber-400" />
                  <p className="text-sm font-semibold">Registrations open — claim your squad slot!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {registeredTeams.map((team, idx) => (
                    <div
                      key={team.id}
                      className="relative flex items-center gap-4 ff-3d-card rounded-2xl px-5 py-4 hover:border-amber-500/60 transition-all duration-300"
                    >
                      {/* Slot number badge */}
                      <div
                        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border shadow-lg ${idx === 0
                          ? "bg-amber-500/20 text-amber-300 border-amber-400/60"
                          : idx === 1
                            ? "bg-slate-400/20 text-slate-200 border-slate-400/60"
                            : idx === 2
                              ? "bg-orange-500/20 text-orange-400 border-orange-500/60"
                              : "bg-slate-800 text-amber-400 border-amber-500/30"
                          }`}
                      >
                        #{team.slot_number ?? idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm text-white truncate uppercase tracking-wider">{team.team_name}</p>
                        <p className="text-xs text-amber-400/90 truncate font-semibold">
                          {team.player1_ign}
                        </p>
                      </div>
                      {idx === 0 && (
                        <span className="absolute top-2 right-3 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                          🥇 SLOT 01
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Prize Pool Section ── */}
          <section id="prizes" className="py-16 px-4 border-b border-amber-500/20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide mb-2 flex items-center gap-2 justify-center text-amber-400">
                  <Trophy className="w-7 h-7 text-amber-400" /> Tournament Prize Pool
                </h2>
                <p className="text-slate-300 text-base font-semibold">
                  Grand Rewards:{" "}
                  <span className="font-black text-2xl ff-title">
                    {d.totalPrizePool}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {d.prizes.map((p) => (
                  <PrizeTier key={p.position} {...p} />
                ))}
              </div>
            </div>
          </section>

          {/* ── Day Schedule Section ── */}
          <section id="schedule" className="py-16 px-4 border-b border-amber-500/20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide mb-2 flex items-center gap-3 text-amber-400">
                <Clock className="w-7 h-7 text-amber-400" /> Tournament Match Schedule
              </h2>
              <p className="text-slate-300 mb-10 text-sm font-medium">
                {d.tournamentDate} &bull; All match times in IST
              </p>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[22px] top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 via-orange-500 to-transparent shadow-[0_0_10px_rgba(245,158,11,0.5)]" />

                <div className="space-y-4">
                  {d.schedule.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 group"
                    >
                      {/* Timeline Dot */}
                      <div className="relative z-10 flex-shrink-0 w-11 h-11 rounded-xl bg-slate-900 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 group-hover:border-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300 shadow-lg">
                        {item.icon}
                      </div>
                      {/* Timeline Content */}
                      <div className="flex-1 ff-3d-card border border-amber-500/20 rounded-xl px-5 py-4 group-hover:border-amber-500/50 transition-all duration-300">
                        <div className="flex justify-between items-center gap-2">
                          <p className="font-extrabold text-sm sm:text-base text-white tracking-wide">{item.event}</p>
                          <span className="text-xs font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 rounded-lg px-2.5 py-1 flex-shrink-0">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Venue & Directions Section ── */}
          <section id="venue" className="py-16 px-4 border-b border-amber-500/20">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide mb-2 flex items-center gap-3 text-amber-400">
                <MapPin className="w-7 h-7 text-amber-400" /> LAN Venue & Location
              </h2>
              <p className="text-slate-300 mb-8 text-sm font-medium">
                Offline LAN Faridabad Tournament Arena
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Venue Details */}
                <div className="space-y-4">
                  <div className="ff-3d-card ff-hud-corner rounded-2xl p-6">
                    <h3 className="font-black text-xl text-amber-300 mb-4 uppercase tracking-wide">{d.venue.name}</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <MapPin className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-100">{d.venue.city}</p>
                          <p className="font-mono text-slate-400 text-xs">PIN: {d.venue.pincode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Navigation className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300">
                          Landmark:{" "}
                          <span className="text-amber-300 font-extrabold">
                            {d.venue.landmark}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Travel Info */}
                  <div className="ff-3d-card rounded-2xl p-5 border-amber-500/20">
                    <h3 className="font-extrabold uppercase text-xs tracking-wider mb-3 flex items-center gap-2 text-amber-400">
                      <Info className="w-4 h-4" /> Travel & Commute Guide
                    </h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">🚇</span>
                        <span>
                          <strong className="text-white">Metro:</strong> Bata Chowk Metro Station
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">🚌</span>
                        <span>
                          <strong className="text-white">Bus Stop:</strong> Near by Sector 12 Town Park
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">🚗</span>
                        <span>
                          <strong className="text-white">Car/Cab:</strong> Parking managed at venue
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Venue Map Info Card */}
                <div className="ff-3d-card ff-hud-corner rounded-2xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-black text-lg text-amber-400 uppercase tracking-wide flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-400" /> Location & Map
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      The tournament is organized offline at <strong className="text-white">{d.venue.name}</strong>. Ensure your entire squad reaches the venue 30 minutes prior to check-in.
                    </p>

                    {/* Embedded Google Map */}
                    <div className="w-full h-48 rounded-xl overflow-hidden border border-amber-500/30 shadow-lg">
                      <iframe
                        src={d.venue.mapEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Tournament Venue Map"
                      />
                    </div>
                  </div>

                  <Button asChild size="lg" className="ff-button w-full text-sm font-extrabold tracking-wider py-6">
                    <a href={d.venue.directionsUrl} target="_blank" rel="noopener noreferrer">
                      Get Directions on Google Maps <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Rules Section ── */}
          <section id="rules" className="py-16 px-4 border-b border-amber-500/20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide mb-2 flex items-center gap-3 text-amber-400">
                <Shield className="w-7 h-7 text-amber-400" /> Tournament Rules
              </h2>
              <p className="text-slate-300 mb-8 text-sm font-medium">
                Official battleground rules for all participating squads.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {d.rules.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 ff-3d-card rounded-xl p-4 border-amber-500/20"
                  >
                    <span className="text-amber-300 font-black text-xs flex-shrink-0 w-6 h-6 bg-amber-500/20 border border-amber-500/40 rounded-lg flex items-center justify-center">
                      0{i + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-200">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Points Calculator Section ── */}
          <section id="points-calculator" className="py-16 px-4 border-b border-amber-500/20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide mb-2 flex items-center gap-3 text-amber-400">
                <Calculator className="w-7 h-7 text-amber-400" /> Live Match Points Calculator
              </h2>
              <p className="text-slate-300 mb-8 text-sm font-medium">
                Test your squad points based on rank finish and kill counts (+1 pt per kill).
              </p>
              <PointsCalculator />
            </div>
          </section>

          {/* ── FAQ Section ── */}
          <section id="faq" className="py-16 px-4 border-b border-amber-500/20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide mb-2 flex items-center gap-3 text-amber-400">
                <Info className="w-7 h-7 text-amber-400" /> Frequently Asked Questions
              </h2>
              <p className="text-slate-300 mb-8 text-sm font-medium">
                Got questions about registration, match setup, or rewards?
              </p>
              <div className="space-y-4">
                {d.faqs.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          </section>

          {/* ── Contact Section ── */}
          <section id="contact" className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide mb-2 flex items-center gap-3 text-amber-400">
                <Phone className="w-7 h-7 text-amber-400" /> Contact & Support
              </h2>
              <p className="text-slate-300 mb-8 text-sm font-medium">
                Reach out to tournament organizers directly.
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
                    className="ff-3d-card rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-amber-500/60 transition-all duration-300 group"
                  >
                    <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                        {item.label}
                      </p>
                      <p className="font-extrabold text-sm text-white truncate max-w-[180px]">{item.value}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Final CTA Banner */}
              <div className="ff-3d-card ff-hud-corner rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-r from-amber-950/80 via-orange-950/60 to-slate-950 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
                    Ready to Dominate the Arena?
                  </h3>
                  <p className="text-slate-300 mb-8 text-sm sm:text-base max-w-lg mx-auto font-medium">
                    Slots are filling up fast! Register your squad now before slots close.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="ff-button text-lg font-black uppercase tracking-wider px-12 py-7 shadow-2xl"
                    id="final-register-btn"
                  >
                    <Link to="/tournament/register-with-payment">
                      Register Your Squad <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default TournamentInfoPage;
