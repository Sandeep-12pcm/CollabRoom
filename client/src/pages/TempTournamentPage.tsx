import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import qrCode from "@/assets/qr_code.png";
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
  const amount = 40;
  const upiId = "7303042793@upi";
  const name = "CollabRoom";
  const note = "Tournament Registration";

  const paymentLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    name
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;


  const [formData, setFormData] = useState({
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

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        // Redirect to login with state to return here
        navigate("/auth", {
          state: { from: { pathname: "/tournament/register" } },
        });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPaymentScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentScreenshot) {
      toast({
        title: "Missing payment screenshot",
        description: "Please upload your payment screenshot.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload screenshot to Supabase Storage
      const fileExt = paymentScreenshot.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("tournament-receipts")
        .upload(filePath, paymentScreenshot);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("tournament-receipts")
        .getPublicUrl(filePath);

      // 2. Save registration data
      const { error: dbError } = await supabase
        .from("tournament-registrations")
        .insert({
          user_id: session.user.id,
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
          payment_screenshot_url: publicUrl,
          user_email: session.user.email,
          status: 'pending'
        });

      if (dbError) {
        // Fallback if table name is different in user setup
        const { error: dbErrorFallback } = await supabase
          .from("tournament_registrations")
          .insert({
            user_id: session.user.id,
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
            payment_screenshot_url: publicUrl,
            user_email: session.user.email,
            status: 'pending'
          });
        if (dbErrorFallback) throw dbErrorFallback;
      }

      toast({
        title: "Registration successful!",
        description: "Your team has been registered for the tournament.",
      });

      // Clear form
      setFormData({
        player1Ign: "", player1Uid: "",
        player2Ign: "", player2Uid: "",
        player3Ign: "", player3Uid: "",
        player4Ign: "", player4Uid: "",
        player5Ign: "", player5Uid: "",
      });
      setPaymentScreenshot(null);
      // Reset file input by id
      const fileInput = document.getElementById("paymentScreenshot") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

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
              <CardTitle className="text-3xl font-bold tracking-tight text-primary">Tournament Registration</CardTitle>
              <CardDescription className="text-base mt-2">
                Register your team. 4 players are compulsory, 1 is optional. Please upload your payment receipt at the end.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-8">

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

                {/* Payment Screenshot */}
                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                  <h3 className="text-lg font-semibold mb-4 text-primary">Payment Verification</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentScreenshot">Upload Payment Screenshot</Label>
                      <Input
                        id="paymentScreenshot"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                        className="cursor-pointer bg-background"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please upload a clear screenshot of your transaction receipt. Ensure the transaction ID is visible.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pay ₹{amount} to complete your registration:
                      <br />
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        Click to Pay via UPI
                      </a>
                    </p>
                    <img src={qrCode} alt="UPI QR Code" className="w-52 h-52 object-contain" />
                    <p className="text-sm text-muted-foreground">UPI ID : sandybhai@upi </p>
                    <p className="text-sm text-muted-foreground">for cash payments please contact <a href="https://instagram.com/collabrooms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">IG::CollabRooms</a></p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
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
