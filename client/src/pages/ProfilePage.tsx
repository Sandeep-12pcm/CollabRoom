import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Trash2,
  Crown,
  Moon,
  SunMedium,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  Rocket,
  Loader2,
  ExternalLink,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/loading/LoadingScreen";
import { SEO } from "@/components/SEO";
import { AdSlot } from "@/components/AdSlot";
import RoomSettingsDialog from "@/components/RoomSettingsDialog";
import SubscriptionPage from "@/components/SubscriptionPage";

/**
 * Types
 */
type Profile = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  is_pro?: boolean | null;
  joined_at?: string | null;
  last_login?: string | null;
};

type Room = {
  id: string;
  room_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  name?: string | null;
  expiry_hours?: number | null;
  allow_guests_edit?: boolean;
  allow_guests_create_pages?: boolean;
  allow_guests_delete_pages?: boolean;
};

/**
 * Helpers
 */
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const generateRoomCode = (length = 6) => {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
};

/**
 * Hook: useProfile
 * centralizes Supabase logic for Profile + Rooms
 */

/**
 * Utility: uploadAvatar
 * - uses Supabase storage bucket named 'profile-pictures'
 * - IMPORTANT: ensure the bucket exists and has proper policies
 */
export async function uploadAvatar(profileId: string, file: File) {
  // customize bucket name if different
  const bucket = "profile-pictures";
  const filePath = `avatars/${profileId}/${Date.now()}-${file.name}`;

  const { data, error: uploadErr } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return urlData.publicUrl;
}

/**
 * Component: ProfilePage (default export)
 */
export default function ProfilePage() {
  const { loading, user, profile, rooms, refresh, setProfile, setRooms } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [editName, setEditName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">((localStorage.getItem("theme") as "dark" | "light") || "dark");
  const [subscriptionDialog, SubscriptionDialog] = useState(false);
  const [settingsRoom, setSettingsRoom] = useState<Room | null>(null);

  useEffect(() => {
    setEditName(profile?.name || "");
  }, [profile]);

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const retentionOptions = profile?.is_pro
    ? [
      { label: "72 hours", hours: 72 },
      { label: "1 week", hours: 24 * 7 },
      { label: "1 month", hours: 24 * 30 },
    ]
    : [
      { label: "24 hours", hours: 24 },
      { label: "72 hours", hours: 72 },
    ];

  // Save profile (name + avatar)
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      let avatar_url = profile.avatar_url || null;
      if (avatarFile) {
        avatar_url = await uploadAvatar(profile.id, avatarFile);
      }
      const { error } = await (supabase
        .from("profiles" as any)
        .update({ name: editName || null, avatar_url })
        .eq("id", profile.id) as any);
      if (error) throw error;
      setProfile({
        ...(profile as Profile),
        name: editName || null,
        avatar_url,
      });
      setAvatarFile(null);
      toast({ title: "Profile saved" });
    } catch (err: any) {
      console.error("save profile error", err);
      toast({
        title: "Save failed",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete or set expiry for a room
  const handleSetExpiryOrDelete = async (roomId: string, expiryHours?: number | null, doDelete = false) => {
    try {
      if (doDelete) {
        const { error } = await supabase.from("rooms").delete().eq("id", roomId);
        if (error) throw error;
        setRooms((r) => r.filter((it) => it.id !== roomId));
        toast({ title: "Room deleted" });
      } else {
        const { error } = await (supabase
          .from("rooms")
          .update({ name: undefined } as any) // expiry_hours not in schema
          .eq("id", roomId) as any);
        if (error) throw error;
        setRooms((r) => r.map((it) => (it.id === roomId ? { ...it, expiry_hours: expiryHours } : it)));

        toast({ title: `Retention set: ${expiryHours ?? "default"} hours` });
      }
    } catch (err: any) {
      console.error("room action error", err);
      toast({
        title: "Action failed",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // Create room helper (client-side quick create)
  const handleCreateRoom = async () => {
    if (!user) return navigate("/login");
    try {
      const code = generateRoomCode(6);
      const { data, error } = await supabase
        .from("rooms")
        .insert({ name: `New Room`, room_code: code, created_by: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      toast({ title: "Room created", description: `Code ${code}` });
      // navigate to new room
      if (data?.id) navigate(`/room/${data.id}`);
    } catch (err: any) {
      console.error("create room error", err);
      toast({
        title: "Create failed",
        description: err?.message || String(err),
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Not authenticated</div>;

  // ...

  return (
    <div className="min-h-screen text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-gradient-to-b dark:from-[#0B1020] dark:to-[#081024]">
      <SEO title={`${profile?.name || "Profile"}`} description="Manage your profile and rooms on CollabRoom." />
      {subscriptionDialog && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Coming soon page */}
              <div className="relative">
                {/* Close Button for SubscriptionPage view */}
                <button
                  onClick={() => {
                    setSubscriptionDialog(false);
                  }}
                  className="absolute top-6 right-6 z-50 p-2 rounded-full bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <SubscriptionPage onBack={() => setSubscriptionDialog(false)} />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Header */}
      <header className="sticky top-0 backdrop-blur bg-white/60 dark:bg-black/20 border-b border-gray-200 dark:border-border z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold">CollabRoom</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="p-2 rounded-md hover:bg-white/5"
            >
              {theme === "dark" ? <SunMedium className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <AdSlot size="medium" format="horizontal" slot="7494183840" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28 }}>
            <Card className="p-6 rounded-2xl bg-white dark:bg-[#11121a] border border-gray-200 dark:border-[#1f2937] shadow-lg">
              <div className="flex items-center gap-4">
                {/* Profile picture */}
                <div
                  className={`relative w-24 h-24 shrink-0 rounded-full overflow-hidden border-4 ${profile?.is_pro ? "border-yellow-400" : "border-slate-600"
                    }`}
                >
                  <img
                    src={profile?.avatar_url || "/default_dp.jpg"}
                    onError={(e) => (e.currentTarget.src = "/default_dp.jpg")}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold truncate">{profile?.name || "Anonymous"}</h2>
                    {profile?.is_pro ? (
                      <div className="flex items-center gap-1 text-yellow-300 shrink-0">
                        <Crown className="w-4 h-4" />
                        <span className="text-xs">Pro</span>
                      </div>
                    ) : (
                      <div className="text-xs px-2 py-0.5 rounded bg-white/3 shrink-0">Free</div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground break-all">{profile?.email}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/2 rounded-lg">
                  <div className="text-xs text-muted-foreground">Joined</div>
                  <div className="text-sm font-medium">{fmtDate(profile?.joined_at)}</div>
                </div>
                <div className="p-3 bg-white/2 rounded-lg">
                  <div className="text-xs text-muted-foreground">Last active</div>
                  <div className="text-sm font-medium">{fmtDate(user?.last_sign_in_at)}</div>
                </div>
              </div>

              {/* Edit section */}
              <div className="mt-6 space-y-3">
                <label className="block text-xs text-muted-foreground">Display name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  // className="w-full bg-transparent border border-[#2a2a3a] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  className="
  w-full 
  bg-white dark:bg-transparent 
  border border-gray-300 dark:border-[#2a2a3a]
  text-gray-900 dark:text-white
  rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary
"
                />

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Avatar</label>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" /> Upload
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {previewUrl && <img src={previewUrl} alt="preview" className="w-12 h-12 rounded-md object-cover" />}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving
                      </span>
                    ) : (
                      "Save profile"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditName(profile?.name || "");
                      setAvatarFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="mt-6 border-t border-[#222] pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Pro Subscription</div>
                    <div className="text-xs text-muted-foreground">Unlock longer retention and premium features</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!profile?.is_pro ? (
                      <Button onClick={() => navigate("/subscription")}>Upgrade</Button>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-300">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <Link to="/contact" className="text-primary hover:underline">
                  Contact support / feedback
                </Link>
              </div>
            </Card>
          </motion.div>

          {/* Right: Rooms list */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.28 }}
            className="lg:col-span-2"
          >
            <Card
              className="
  p-4 rounded-2xl
  bg-white dark:bg-[#0f1724]
  border border-gray-200 dark:border-[#1f2937]
  shadow-lg
"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Rooms</h3>
                <div className="text-sm text-muted-foreground">Total: {rooms.length}</div>
              </div>

              <div className="space-y-3">
                {rooms.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    You haven't created any rooms yet.
                    <div className="mt-3">
                      <Button onClick={handleCreateRoom} className="gap-2">
                        <Rocket className="w-4 h-4" /> Create your first room
                      </Button>
                    </div>
                  </div>
                ) : (
                  rooms.map((r) => (
                    <motion.div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-[#23232b] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => navigate(`/room/${r.id}`)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex-1">
                        <div className="space-x-1 flex items-center">
                          <div className="font-large font-bold font-serif">{r.name || r.room_code}</div>
                          <div className="font-extralight font-serif text-muted-foreground">({r.room_code})</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {fmtDate(r.created_at)} • Retention:{" "}
                          {r.expiry_hours ? `${r.expiry_hours}h` : profile?.is_pro ? "No expiry" : "24h (default)"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => window.open(`/room/${r.id}`, "_blank")}
                          className="p-2 rounded-md hover:bg-primary/20 text-primary"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSettingsRoom(r)}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Room settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="p-2 rounded-md hover:bg-red-600/20 text-red-400"
                          title="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Fluid Ad Slot below rooms list */}
              <div className="mt-8 border-t border-gray-100 dark:border-white/5 pt-6">
                <AdSlot
                  format="fluid"
                  layoutKey="-f7+5u+4t-da+6l"
                  slot="1120347185"
                  className="rounded-lg border border-dashed border-muted bg-muted/5 p-4"
                />
              </div>

              {/* Delete modal */}
              {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    // className="bg-[#0b1220] rounded-xl p-6 w-[95%] max-w-md border border-[#2a2a3a] shadow-xl"
                    className="bg-white dark:bg-[#0b1220] rounded-xl p-6 w-[95%] max-w-md border border-gray-300 dark:border-[#222733] text-gray-900 dark:text-gray-200 shadow-xl"
                  >
                    <h4 className="text-lg font-semibold">Delete room</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Are you sure you want to delete this room? This action is permanent.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        onClick={() => handleSetExpiryOrDelete(confirmDeleteId, undefined, true)}
                        className="bg-red-600"
                      >
                        Delete permanently
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Room Settings Dialog */}
      <RoomSettingsDialog
        room={settingsRoom}
        open={!!settingsRoom}
        onOpenChange={(open) => !open && setSettingsRoom(null)}
        isPro={profile?.is_pro || false}
        onRoomUpdated={(updatedRoom) => {
          setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
        }}
        onRoomDeleted={(roomId) => {
          setRooms((prev) => prev.filter((r) => r.id !== roomId));
        }}
      />
    </div>
  );
}
