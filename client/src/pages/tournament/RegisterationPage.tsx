import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Info, UserCheck, X, Flame, Trophy, Target, Shield, Gamepad2, Upload } from "lucide-react";

export const TempTournamentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Auth & Email State
  const [userEmail, setUserEmail] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    teamName: "",
    mobileNumber: "",
    player1Ign: "",
    player1Uid: "",
    player2Ign: "",
    player2Uid: "",
    player3Ign: "",
    player3Uid: "",
    player4Ign: "",
    player4Uid: "",
    player5Ign: "",
    player5Uid: "",
  });

  // Screenshot Upload State
  const [playerScreenshots, setPlayerScreenshots] = useState<{ [key: number]: File | null }>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  });

  const [screenshotPreviews, setScreenshotPreviews] = useState<{ [key: number]: string | null }>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  });

  // Auth Session Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSession(data.session);
        if (data.session.user?.email) {
          setUserEmail(data.session.user.email);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleScreenshotChange = (playerNum: number, file: File | null) => {
    if (file) {
      setPlayerScreenshots((prev) => ({ ...prev, [playerNum]: file }));
      const previewUrl = URL.createObjectURL(file);
      setScreenshotPreviews((prev) => ({ ...prev, [playerNum]: previewUrl }));
    } else {
      setPlayerScreenshots((prev) => ({ ...prev, [playerNum]: null }));
      if (screenshotPreviews[playerNum]) {
        URL.revokeObjectURL(screenshotPreviews[playerNum]!);
      }
      setScreenshotPreviews((prev) => ({ ...prev, [playerNum]: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final email address
    const finalEmail = session?.user?.email || userEmail.trim();
    if (!finalEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address or log in before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Validate player details: Each compulsory player must have either manual details or screenshot uploaded
    for (let num = 1; num <= 4; num++) {
      const ign = (formData[`player${num}Ign` as keyof typeof formData] || "").trim();
      const uid = (formData[`player${num}Uid` as keyof typeof formData] || "").trim();
      const screenshot = playerScreenshots[num];

      const hasManual = Boolean(ign && uid);
      const hasScreenshot = Boolean(screenshot);

      if (!hasManual && !hasScreenshot) {
        toast({
          title: `Player ${num} details missing`,
          description: `Please enter details manually or upload an In-Game ID screenshot for Player ${num}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      // 1. Upload player screenshots to Supabase Storage if any exist
      const uploadedScreenshotUrls: { [key: number]: string } = {};

      for (let num = 1; num <= 5; num++) {
        const file = playerScreenshots[num];
        if (file) {
          const fileExt = file.name.split(".").pop();
          const fileName = `game_ids/${Date.now()}_player${num}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("tournament-receipts")
            .upload(fileName, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("tournament-receipts")
              .getPublicUrl(fileName);
            uploadedScreenshotUrls[num] = publicUrl;
          } else {
            console.warn(`Failed to upload screenshot for player ${num}:`, uploadError);
          }
        }
      }

      // Helper function to build final IGN and UID for DB insertion
      const getPlayerIgn = (num: number, manualIgn: string) => {
        if (manualIgn.trim()) return manualIgn.trim();
        if (uploadedScreenshotUrls[num]) return `[Screenshot Uploaded: Player ${num}]`;
        return "";
      };

      const getPlayerUid = (num: number, manualUid: string) => {
        if (manualUid.trim()) return manualUid.trim();
        if (uploadedScreenshotUrls[num]) return uploadedScreenshotUrls[num];
        return "";
      };

      // Combine uploaded screenshot links into payment_screenshot_url field
      const screenshotUrlList = Object.values(uploadedScreenshotUrls);
      const compositeScreenshotNote = screenshotUrlList.length > 0
        ? `Game ID Screenshots: ${screenshotUrlList.join(" | ")}`
        : "Unpaid Tournament";

      // 2. Insert registration into Supabase database
      const { error: dbError } = await supabase
        .from("tournament_registrations")
        .insert({
          user_id: session?.user?.id || null,
          team_name: formData.teamName,
          mobile_number: formData.mobileNumber,
          player1_ign: getPlayerIgn(1, formData.player1Ign),
          player1_uid: getPlayerUid(1, formData.player1Uid),
          player2_ign: getPlayerIgn(2, formData.player2Ign),
          player2_uid: getPlayerUid(2, formData.player2Uid),
          player3_ign: getPlayerIgn(3, formData.player3Ign),
          player3_uid: getPlayerUid(3, formData.player3Uid),
          player4_ign: getPlayerIgn(4, formData.player4Ign),
          player4_uid: getPlayerUid(4, formData.player4Uid),
          player5_ign: getPlayerIgn(5, formData.player5Ign) || null,
          player5_uid: getPlayerUid(5, formData.player5Uid) || null,
          payment_screenshot_url: compositeScreenshotNote,
          user_email: finalEmail,
          status: 'pending',
          tournament_code: 'lan_season_2',
        });

      if (dbError) throw dbError;

      toast({
        title: "Registration successful!",
        description: "Your team has been registered for the tournament.",
      });

      // Show alert message
      window.alert(`You will receive a mail on registered email id (${finalEmail}) once approved. Please check your inbox as well as spam folder.`);

      // Clear form
      setFormData({
        teamName: "", mobileNumber: "",
        player1Ign: "", player1Uid: "",
        player2Ign: "", player2Uid: "",
        player3Ign: "", player3Uid: "",
        player4Ign: "", player4Uid: "",
        player5Ign: "", player5Uid: "",
      });
      setPlayerScreenshots({ 1: null, 2: null, 3: null, 4: null, 5: null });
      setScreenshotPreviews({ 1: null, 2: null, 3: null, 4: null, 5: null });

      navigate("/tournament/info");

    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ff-gaming-bg text-amber-400">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen ff-gaming-bg text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      <SEO title="FFM Tournament Registration" description="Register your squad for the Free Fire MAX Tournament." />
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Main Card with Free Fire MAX styling */}
          <Card className="ff-card shadow-2xl overflow-hidden border-amber-500/30">
            <CardHeader className="text-center pb-8 border-b border-amber-500/20 bg-gradient-to-b from-amber-950/40 via-amber-900/10 to-transparent relative">

              {/* Tactical Top Tag */}
              <div className="flex justify-center mb-3">
                <span className="ff-badge px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
                  FREE FIRE MAX BATTLEGROUNDS
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                </span>
              </div>

              <CardTitle className="ff-title text-3xl sm:text-4xl font-extrabold tracking-wider uppercase drop-shadow-md">
                FFM LAN FARIDABAD TOURNAMENT
              </CardTitle>

              <CardDescription className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl mx-auto flex items-center justify-center gap-2">
                <Gamepad2 className="h-4 w-4 text-amber-400 shrink-0" />
                Assemble your squad! 4 Players Compulsory • 1 Substitute Optional
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-8 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Email / Authentication Banner */}
                {session?.user ? (
                  <div className="ff-card-glow p-5 rounded-xl border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase font-bold tracking-wider text-amber-400">COMMANDER EMAIL REGISTERED</p>
                        <p className="text-lg font-extrabold text-white tracking-wider break-words">{session.user.email}</p>
                        <p className="text-xs text-amber-300/80 font-medium mt-1 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          All communication mails will be sent to this mail id.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/auth?redirectTo=%2Ftournament%2Fregister")}
                      className="shrink-0 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 hover:text-white"
                    >
                      Switch Account
                    </Button>
                  </div>
                ) : (
                  <div className="ff-card p-5 rounded-xl border border-amber-500/30 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-sm uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-amber-400" />
                        Commander Communication Email
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 hover:text-amber-300 underline p-0 h-auto font-medium text-xs"
                        onClick={() => navigate("/auth?redirectTo=%2Ftournament%2Fregister")}
                      >
                        Already registered? Log In
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userEmail" className="text-slate-200 text-xs uppercase font-semibold">Email Address</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        placeholder="e.g. survivor@freefire.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                        className="ff-input"
                      />
                      <p className="text-xs text-amber-400 font-medium flex items-center gap-1.5 mt-1.5">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        All communication mails will be sent to this mail id.
                      </p>
                    </div>
                  </div>
                )}

                {/* Team Info Card */}
                <div className="ff-card p-6 rounded-xl border border-amber-500/20 space-y-4">
                  <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
                    <Shield className="h-5 w-5 text-amber-400" />
                    <h3 className="text-lg font-extrabold uppercase tracking-wide text-amber-400">Squad Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName" className="text-slate-200 text-xs uppercase font-semibold">Squad / Team Name</Label>
                      <Input
                        id="teamName"
                        placeholder="e.g. SQUAD ALPHA"
                        value={formData.teamName}
                        onChange={handleInputChange}
                        required
                        className="ff-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber" className="text-slate-200 text-xs uppercase font-semibold">WhatsApp / Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        placeholder="e.g. 9876543210"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        required
                        type="tel"
                        className="ff-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Helper Banner */}
                <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-4 rounded-xl border border-amber-500/30 flex items-center gap-3 text-sm text-amber-200 shadow-md">
                  <Target className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
                  <span className="font-medium">You can either upload or enter details manually for each player.</span>
                </div>

                {/* Players 1-4 (Compulsory) */}
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="ff-card p-6 rounded-xl border border-amber-500/30 space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xs px-2.5 py-1 rounded">
                          0{num}
                        </span>
                        <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-100">
                          Player {num} <span className="text-amber-400 text-xs font-semibold ml-1">(COMPULSORY)</span>
                        </h3>
                      </div>
                      <span className="text-xs text-amber-400/80 font-medium hidden sm:inline-block">Manual Entry or Screenshot</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`player${num}Ign`} className="text-slate-300 text-xs uppercase">In-Game Name (IGN)</Label>
                        <Input
                          id={`player${num}Ign`}
                          placeholder="e.g. ShadowSlayer"
                          value={formData[`player${num}Ign` as keyof typeof formData]}
                          onChange={handleInputChange}
                          className="ff-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`player${num}Uid`} className="text-slate-300 text-xs uppercase">In-Game UID</Label>
                        <Input
                          id={`player${num}Uid`}
                          placeholder="e.g. 123456789"
                          value={formData[`player${num}Uid` as keyof typeof formData]}
                          onChange={handleInputChange}
                          className="ff-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-amber-500/20">
                      <Label htmlFor={`player${num}Screenshot`} className="text-xs uppercase font-semibold text-amber-400 flex items-center gap-1.5">
                        <Upload className="h-3.5 w-3.5" />
                        OR Upload Player {num} In-Game Profile Screenshot
                      </Label>
                      {screenshotPreviews[num] ? (
                        <div className="relative inline-block mt-2">
                          <img
                            src={screenshotPreviews[num]!}
                            alt={`Player ${num} Game ID Screenshot`}
                            className="w-52 h-32 object-cover rounded-lg border-2 border-amber-500/50 shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleScreenshotChange(num, null)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition-colors"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <Input
                          id={`player${num}Screenshot`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleScreenshotChange(num, e.target.files?.[0] || null)}
                          className="ff-input cursor-pointer file:bg-amber-500/20 file:text-amber-300 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:font-semibold"
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* Player 5 (Optional / Substitute) */}
                <div className="ff-card p-6 rounded-xl border border-amber-500/20 border-dashed space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-800 border border-slate-700 text-slate-400 font-black text-xs px-2.5 py-1 rounded">
                        05
                      </span>
                      <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-300">
                        Player 5 <span className="text-slate-400 text-xs font-normal ml-1">(OPTIONAL / SUBSTITUTE)</span>
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="player5Ign" className="text-slate-400 text-xs uppercase">In-Game Name (IGN)</Label>
                      <Input
                        id="player5Ign"
                        placeholder="e.g. StealthSniper"
                        value={formData.player5Ign}
                        onChange={handleInputChange}
                        className="ff-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="player5Uid" className="text-slate-400 text-xs uppercase">In-Game UID</Label>
                      <Input
                        id="player5Uid"
                        placeholder="e.g. 987654321"
                        value={formData.player5Uid}
                        onChange={handleInputChange}
                        className="ff-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-amber-500/20">
                    <Label htmlFor="player5Screenshot" className="text-xs uppercase font-semibold text-amber-400/80 flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      OR Upload Player 5 In-Game Profile Screenshot (Optional)
                    </Label>
                    {screenshotPreviews[5] ? (
                      <div className="relative inline-block mt-2">
                        <img
                          src={screenshotPreviews[5]!}
                          alt="Player 5 Game ID Screenshot"
                          className="w-52 h-32 object-cover rounded-lg border-2 border-amber-500/50 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleScreenshotChange(5, null)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition-colors"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Input
                        id="player5Screenshot"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleScreenshotChange(5, e.target.files?.[0] || null)}
                        className="ff-input cursor-pointer file:bg-amber-500/20 file:text-amber-300 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:font-semibold"
                      />
                    )}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-amber-500/20">
                  <a
                    href="https://www.youtube.com/@aigamerwala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 hover:underline"
                  >
                    <Flame className="h-4 w-4 text-amber-500" />
                    Watch Official Rules on YouTube
                  </a>

                  <Button type="submit" size="lg" disabled={submitting} className="ff-button w-full sm:w-auto px-10 py-6 text-base font-extrabold tracking-wider">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        SUBMITTING SQUAD...
                      </>
                    ) : (
                      "REGISTER SQUAD NOW"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TempTournamentPage;
