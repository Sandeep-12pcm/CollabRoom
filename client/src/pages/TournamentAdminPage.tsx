import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ADMIN_EMAILS } from "@/constants/config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, AlertCircle, CheckCircle, Mail, XCircle, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";


export const TournamentAdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const HOST = import.meta.env.VITE_HOST_URL || "http://localhost:4000";

    const checkAuthAndFetchData = async () => {
      // Fire session check AND a server pre-warm ping in parallel
      const [sessionResult] = await Promise.all([
        supabase.auth.getSession(),
        // Pre-warm the Render server so it's ready by the time we need it
        fetch(`${HOST}/api/tournament/registrations`, { method: "HEAD" }).catch(() => null),
      ]);

      const { data: { session }, error: sessionError } = sessionResult;

      if (sessionError || !session) {
        navigate("/auth", { state: { from: { pathname: "/tournament/admin" } } });
        return;
      }

      const userEmail = session.user.email;
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      try {
        // Fetch via backend server (uses service role key — bypasses Supabase RLS)
        const response = await fetch(`${HOST}/api/tournament/registrations`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load registrations");
        }

        setRegistrations(result.data || []);
      } catch (err: any) {
        console.error("Failed to fetch registrations:", err);
        setError(err.message || "Failed to load registrations.");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const handleStatusUpdate = async (registrationId: string, userEmail: string, status: "approved" | "rejected") => {
    let reason = null;
    if (status === "rejected") {
      reason = window.prompt("Reason for rejection (e.g. 'Slot is full', 'Incorrect payment'):");
      if (reason === null) return; // User cancelled
    }

    setProcessingId(registrationId);
    try {
      const response = await fetch(`${import.meta.env.VITE_HOST_URL || "http://localhost:4000"}/api/tournament/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, userEmail, status, reason }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to mark as ${status}`);
      }

      if (result.emailError) {
        toast({
          title: `Status updated to ${status} but email failed`,
          description: "Database status updated but the confirmation/rejection email could not be sent. Check SMTP config.",
          variant: "destructive",
        });
      } else {
        toast({
          title: `Successfully ${status}!`,
          description: `Registration ${status} and email sent to user.`,
        });
      }

      // Update local state
      setRegistrations((prev) =>
        prev.map((reg) => (reg.id === registrationId ? { ...reg, status } : reg))
      );
    } catch (err: any) {
      toast({
        title: "Error updating status",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const exportToXLSX = () => {
    const rows = registrations.map((reg) => ({
      "Team Name":    reg.team_name ?? "",
      "Player 1 UID": reg.player1_uid ?? "",
      "Player 1 IGN": reg.player1_ign ?? "",
      "Player 2 UID": reg.player2_uid ?? "",
      "Player 2 IGN": reg.player2_ign ?? "",
      "Player 3 UID": reg.player3_uid ?? "",
      "Player 3 IGN": reg.player3_ign ?? "",
      "Player 4 UID": reg.player4_uid ?? "",
      "Player 4 IGN": reg.player4_ign ?? "",
      "Player 5 UID": reg.player5_uid ?? "",
      "Player 5 IGN": reg.player5_ign ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    const filename = `tournament_registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 px-4 flex items-center justify-center">
          <Card className="max-w-md w-full border-destructive/50">
            <CardHeader className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You do not have permission to view this page. If you are the administrator, please ensure your email is added to the `ADMIN_EMAILS` array in `TournamentAdminPage.tsx`.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Tournament Admin" description="View tournament registrations" />
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Tournament Submissions</h1>
            <p className="text-muted-foreground mt-2">Manage and verify team registrations and payments.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm px-4 py-1 bg-primary/10 text-primary border-primary/20">
              {registrations.length} Teams Registered
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={registrations.length === 0}
              onClick={exportToXLSX}
              className="h-9 text-xs gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export XLSX
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-md overflow-hidden border-border/50">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>User / Status</TableHead>
                  <TableHead>Player 1 (C)</TableHead>
                  <TableHead>Player 2</TableHead>
                  <TableHead>Player 3</TableHead>
                  <TableHead>Player 4</TableHead>
                  <TableHead>Player 5 (Sub)</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.length === 0 && !error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No registrations found yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow key={reg.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium whitespace-nowrap text-xs">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {reg.user_email || "N/A"}
                        </div>
                        <Badge
                          variant={reg.status === "approved" ? "default" : "outline"}
                          className="mt-1 text-[10px] py-0 px-1"
                        >
                          {reg.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{reg.player1_ign}</div>
                        <div className="text-xs text-muted-foreground font-mono">{reg.player1_uid}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{reg.player2_ign}</div>
                        <div className="text-xs text-muted-foreground font-mono">{reg.player2_uid}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{reg.player3_ign}</div>
                        <div className="text-xs text-muted-foreground font-mono">{reg.player3_uid}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{reg.player4_ign}</div>
                        <div className="text-xs text-muted-foreground font-mono">{reg.player4_uid}</div>
                      </TableCell>
                      <TableCell>
                        {reg.player5_ign ? (
                          <>
                            <div className="font-semibold text-sm">{reg.player5_ign}</div>
                            <div className="text-xs text-muted-foreground font-mono">{reg.player5_uid}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={reg.payment_screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-primary hover:text-primary/80 hover:underline"
                        >
                          View Receipt <ExternalLink className="ml-1 w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reg.status === "approved" || processingId === reg.id}
                            onClick={() => handleStatusUpdate(reg.id, reg.user_email, "approved")}
                            className="h-8 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20"
                          >
                            {processingId === reg.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {reg.status === "approved" ? "Approved" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reg.status === "rejected" || processingId === reg.id}
                            onClick={() => handleStatusUpdate(reg.id, reg.user_email, "rejected")}
                            className="h-8 text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 border-red-500/20"
                          >
                            {processingId === reg.id && reg.status !== "rejected" ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {reg.status === "rejected" ? "Rejected" : "Reject"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default TournamentAdminPage;
