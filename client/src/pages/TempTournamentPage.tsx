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
import { Loader2 } from "lucide-react";

export const TempTournamentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);



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



  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        // Redirect to login, returning here after successful auth
        navigate("/auth?redirectTo=%2Ftournament%2Fregister");
      } else {
        setSession(data.session);
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Save registration data
      const { error: dbError } = await supabase
        .from("tournament-registrations")
        .insert({
          user_id: session.user.id,
          team_name: formData.teamName,
          mobile_number: formData.mobileNumber,
          player1_ign: formData.player1Ign,
          player1_uid: formData.player1Uid,
          player2_ign: formData.player2Ign,
          player2_uid: formData.player2Uid,
          player3_ign: formData.player3Ign,
          player3_uid: formData.player3Uid,
          player4_ign: formData.player4Ign,
          player4_uid: formData.player4Uid,
          player5_ign: formData.player5Ign || null,
          player5_uid: formData.player5Uid || null,
          payment_screenshot_url: "Unpaid Tournament",
          user_email: session.user.email,
          status: 'pending'
        });

      if (dbError) {
        // Fallback if table name is different in user setup
        const { error: dbErrorFallback } = await supabase
          .from("tournament_registrations")
          .insert({
            user_id: session.user.id,
            team_name: formData.teamName,
            mobile_number: formData.mobileNumber,
            player1_ign: formData.player1Ign,
            player1_uid: formData.player1Uid,
            player2_ign: formData.player2Ign,
            player2_uid: formData.player2Uid,
            player3_ign: formData.player3Ign,
            player3_uid: formData.player3Uid,
            player4_ign: formData.player4Ign,
            player4_uid: formData.player4Uid,
            player5_ign: formData.player5Ign || null,
            player5_uid: formData.player5Uid || null,
            payment_screenshot_url: null,
            user_email: session.user.email,
            status: 'pending'
          });
        if (dbErrorFallback) throw dbErrorFallback;
      }

      toast({
        title: "Registration successful!",
        description: "Your team has been registered for the tournament.",
      });

      // Show alert window
      window.alert("You will receive a mail on registered email id once approved. Please check your inbox as well as spam folder.");

      // Clear form
      setFormData({
        teamName: "", mobileNumber: "",
        player1Ign: "", player1Uid: "",
        player2Ign: "", player2Uid: "",
        player3Ign: "", player3Uid: "",
        player4Ign: "", player4Uid: "",
        player5Ign: "", player5Uid: "",
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Check if you have run the database setup script.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Tournament Registration" description="Register your team for the upcoming tournament." />
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center pb-8 border-b bg-muted/30">
              <CardTitle className="text-3xl font-bold tracking-tight text-primary">FFM NOIDA Tournament Registration</CardTitle>
              <CardDescription className="text-base mt-2">
                Register your team. 4 players are compulsory, 1 is optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Team Info */}
                <div className="bg-muted/10 p-6 rounded-lg border border-border/50">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Team Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        placeholder="e.g. Team Alpha"
                        value={formData.teamName}
                        onChange={handleInputChange}
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        placeholder="e.g. 9876543210"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        required
                        type="tel"
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Players 1-4 (Compulsory) */}
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="bg-muted/10 p-6 rounded-lg border border-border/50">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Player {num} (Compulsory)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`player${num}Ign`}>In-Game Name (IGN)</Label>
                        <Input
                          id={`player${num}Ign`}
                          placeholder="e.g. ShadowSlayer"
                          value={formData[`player${num}Ign` as keyof typeof formData]}
                          onChange={handleInputChange}
                          required
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`player${num}Uid`}>UID</Label>
                        <Input
                          id={`player${num}Uid`}
                          placeholder="e.g. 123456789"
                          value={formData[`player${num}Uid` as keyof typeof formData]}
                          onChange={handleInputChange}
                          required
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Player 5 (Optional) */}
                <div className="bg-muted/10 p-6 rounded-lg border border-border/50 border-dashed">
                  <h3 className="text-lg font-semibold mb-4 text-foreground/80">Player 5 (Optional / Substitute)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="player5Ign">In-Game Name (IGN)</Label>
                      <Input
                        id="player5Ign"
                        placeholder="e.g. StealthSniper"
                        value={formData.player5Ign}
                        onChange={handleInputChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="player5Uid">UID</Label>
                      <Input
                        id="player5Uid"
                        placeholder="e.g. 987654321"
                        value={formData.player5Uid}
                        onChange={handleInputChange}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>



                <div className="pt-4 flex flex-col sm:flex-row justify-end items-center gap-4">
                  <a
                    href="https://www.youtube.com/@aigamerwala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Watch Rules on YouTube
                  </a>
                  <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto px-8">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Register Team"
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
