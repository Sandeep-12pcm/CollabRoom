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
import { Loader2, ExternalLink, AlertCircle, CheckCircle, Mail, XCircle, Download, Flame, Shield, Trophy, Users } from "lucide-react";
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
      if (reason === null) return;
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
      "Tournament Code": reg.tournament_code ?? "lan_season_2",
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
      <div className="min-h-screen flex items-center justify-center ff-gaming-bg text-amber-400">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen ff-gaming-bg text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 px-4 flex items-center justify-center">
          <Card className="ff-card max-w-md w-full border-red-500/50">
            <CardHeader className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-red-400 font-extrabold uppercase">Access Denied</CardTitle>
              <CardDescription className="text-slate-300">
                You do not have permission to view this page. If you are the administrator, please ensure your email is added to the `ADMIN_EMAILS` array.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen ff-gaming-bg text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      <SEO title="Tournament Admin" description="View tournament registrations" />
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-5 w-5 text-amber-400" />
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400">COMMAND CENTER</span>
            </div>
            <h1 className="ff-title text-3xl sm:text-4xl font-black uppercase tracking-wider">Tournament Submissions</h1>
            <p className="text-slate-300 text-sm mt-1">Manage and verify squad registrations and payment receipts.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="ff-badge text-xs px-4 py-1.5 font-bold flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {registrations.length} Squads Registered
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={registrations.length === 0}
              onClick={exportToXLSX}
              className="h-10 text-xs font-bold gap-1.5 border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-white"
            >
              <Download className="w-4 h-4" />
              EXPORT XLSX
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-950/40 text-red-200">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertTitle className="font-bold">Error Loading Data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="ff-card shadow-2xl overflow-hidden border-amber-500/30">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/90 border-b border-amber-500/30">
                <TableRow className="border-amber-500/30 hover:bg-transparent">
                  <TableHead className="w-[100px] text-amber-400 font-bold uppercase text-xs">Date</TableHead>
                  <TableHead className="text-amber-400 font-bold uppercase text-xs">User / Status</TableHead>
                  <TableHead className="text-amber-400 font-bold uppercase text-xs">Player 1 (C)</TableHead>
                  <TableHead className="text-amber-400 font-bold uppercase text-xs">Player 2</TableHead>
                  <TableHead className="text-amber-400 font-bold uppercase text-xs">Player 3</TableHead>
                  <TableHead className="text-amber-400 font-bold uppercase text-xs">Player 4</TableHead>
                  <TableHead className="text-amber-400 font-bold uppercase text-xs">Player 5 (Sub)</TableHead>
                  <TableHead className="text-right text-amber-400 font-bold uppercase text-xs">Receipt</TableHead>
                  <TableHead className="text-right text-amber-400 font-bold uppercase text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-800/60">
                {registrations.length === 0 && !error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-slate-400">
                      No registrations found yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow key={reg.id} className="hover:bg-amber-500/10 transition-colors border-slate-800">
                      <TableCell className="font-medium whitespace-nowrap text-xs text-slate-300">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-amber-400" />
                          {reg.user_email || "N/A"}
                        </div>
                        <Badge
                          className={`mt-1.5 text-[10px] py-0.5 px-2 font-extrabold uppercase border ${
                            reg.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : reg.status === "rejected"
                              ? "bg-red-500/20 text-red-300 border-red-500/40"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {reg.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm text-slate-100">{reg.player1_ign}</div>
                        <div className="text-xs text-amber-400/90 font-mono">{reg.player1_uid}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm text-slate-100">{reg.player2_ign}</div>
                        <div className="text-xs text-amber-400/90 font-mono">{reg.player2_uid}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm text-slate-100">{reg.player3_ign}</div>
                        <div className="text-xs text-amber-400/90 font-mono">{reg.player3_uid}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm text-slate-100">{reg.player4_ign}</div>
                        <div className="text-xs text-amber-400/90 font-mono">{reg.player4_uid}</div>
                      </TableCell>
                      <TableCell>
                        {reg.player5_ign ? (
                          <>
                            <div className="font-bold text-sm text-slate-100">{reg.player5_ign}</div>
                            <div className="text-xs text-amber-400/90 font-mono">{reg.player5_uid}</div>
                          </>
                        ) : (
                          <span className="text-slate-500 text-xs italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.payment_screenshot_url ? (
                          <a
                            href={reg.payment_screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline gap-1"
                          >
                            View Receipt <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500 text-xs">No Receipt</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reg.status === "approved" || processingId === reg.id}
                            onClick={() => handleStatusUpdate(reg.id, reg.user_email, "approved")}
                            className="h-8 text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-white border-emerald-500/40"
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
                            className="h-8 text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-white border-red-500/40"
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
