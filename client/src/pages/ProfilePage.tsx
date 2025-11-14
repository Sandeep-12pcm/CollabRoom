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
  RocketIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import LoadingScreen from "@/components/loading/LoadingScreen";
type Profile = {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  is_pro?: boolean;
  joined_at?: string | null;
  last_login?: string | null;
};

type Room = {
  id: string;
  name: string;
  created_at?: string;
  expiry_hours?: number | null;
};

/* -------------------------
   Helper: format date
   ------------------------- */
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString() : "—";

/* -------------------------
   Main Component
   ------------------------- */
export default function ProfilePage() {
  const nav = useNavigate();
  const { toast } = useToast
    ? useToast()
    : { toast: (t: any) => console.log(t) }; // fallback
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editName, setEditName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(
    (localStorage.getItem("theme") as "dark" | "light") || "dark"
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* Dark / Light theme apply */
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  /* Auth check -> redirect to /login if not logged in */
  useEffect(() => {
    const check = async () => {
      setLoading(true);
      const {
        data: { user: suser },
        error,
      } = await supabase.auth.getUser();
      if (error || !suser) {
        nav("/login");
        return;
      }
      console.log("found user: ", suser);
      setUser(suser);

      // fetch profile
      const { data: profileData, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", suser.id)
        .maybeSingle();

      if (pErr) {
        console.error("fetch profile error", pErr);
        toast({
          title: "Unable to load profile",
          description: pErr.message || "Check console",
          variant: "destructive",
        });
      } else if (!profileData) {
        console.log("no profile data, creating one");
        // create profile row
        const { data: newProfileData, error: npErr } = await supabase
          .from("profiles")
          .insert({
            id: suser.id,
            email: suser.email,
            name:
              suser.user_metadata.display_name ||
              suser.user_metadata.name ||
              null,
          })
          .select()
          .maybeSingle();
        if (npErr) {
          console.error("create profile error", npErr);
          toast({
            title: "Unable to create profile",
            description: npErr.message || "Check console",
            variant: "destructive",
          });
        } else {
          setProfile(newProfileData || { id: suser.id, email: suser.email });
          setEditName(newProfileData?.name || "");
        }
      } else {
        console.log("profile data", profileData);
        setProfile(profileData || { id: suser.id, email: suser.email });
        setEditName(profileData?.name || "");
      }
      const { data: roomData, error: rErr } = await supabase
        .from("rooms")
        .select("id, name, created_at, expiry_hours")
        .eq("created_by", suser.id)
        .order("created_at", { ascending: false });

      if (rErr) {
        console.error("rooms fetch error", rErr);
        toast({
          title: "Unable to load rooms",
          description: rErr.message || "Check console",
          variant: "destructive",
        });
      } else {
        setRooms(roomData || []);
      }

      setLoading(false);
    };

    check();
  }, [nav, toast]);

  /* Avatar preview */
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  /* -------------------------
     Profile update handlers
     ------------------------- */

  const uploadAvatarAndSave = async (file: File | null, nameVal: string) => {
    // This function demonstrates upload to Supabase storage and update profile row.
    // If you don't use Supabase storage, replace with your own upload endpoint.
    setSavingProfile(true);
    try {
      let avatar_url = profile?.avatar_url || null;

      if (file) {
        // NOTE: customize bucket name and path
        const filePath = `profile-pictures/${profile?.id}-${Date.now()}-${
          file.name
        }`;
        const { data: upData, error: upErr } = await supabase.storage
          .from("profile-pictures")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (upErr) throw upErr;
        const { data: publicURLData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(filePath);
        avatar_url = publicURLData.publicUrl;
      }

      // update profile row
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          name: nameVal,
          avatar_url,
          // you can also update last_login or other fields
        })
        .eq("id", profile?.id);

      if (updateErr) throw updateErr;

      // refresh local
      setProfile((p) => (p ? { ...p, name: nameVal, avatar_url } : p));
      toast({ title: "Profile saved" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Save failed",
        description: err?.message || "See console",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  /* Save changes (name + avatar) */
  const handleSaveProfile = async () => {
    await uploadAvatarAndSave(avatarFile, editName);
    setAvatarFile(null);
  };

  /* -------------------------
     Rooms: delete / retention
     ------------------------- */

  // retentionOptions: free user only 24h; pro user multiple options
  const retentionOptions = profile?.is_pro
    ? [
        { label: "72 hours", hours: 72 },
        { label: "1 week", hours: 24 * 7 },
        { label: "1 month", hours: 24 * 30 },
      ]
    : [{ label: "24 hours", hours: 24 }];

  // Set expiry for a room (update expiry_hours) OR delete
  const handleSetExpiryOrDelete = async (
    roomId: string,
    expiryHours?: number,
    doDelete = false
  ) => {
    try {
      if (doDelete) {
        // immediate delete
        const { error } = await supabase
          .from("rooms")
          .delete()
          .eq("id", roomId);
        if (error) throw error;
        setRooms((rs) => rs.filter((r) => r.id !== roomId));
        toast({ title: "Room deleted" });
        return;
      } else {
        // set expiry_hours so server-side process can auto-delete later
        const { error } = await supabase
          .from("rooms")
          .update({ expiry_hours: expiryHours })
          .eq("id", roomId);
        if (error) throw error;
        setRooms((rs) =>
          rs.map((r) =>
            r.id === roomId ? { ...r, expiry_hours: expiryHours } : r
          )
        );
        toast({ title: `Retention set: ${expiryHours} hours` });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Action failed",
        description: err?.message || "Check console",
        variant: "destructive",
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  /* -------------------------
     UI - if loading show skeleton
     ------------------------- */
  if (loading)
    return (
      // <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0B1020]">
      //   <div className="text-center text-muted-foreground">
      //     <div className="animate-pulse w-64 h-64 rounded-full bg-zinc-800/40 mx-auto mb-6" />
      //     <p className="text-sm">Loading profile…</p>
      //   </div>
      // </div>
      <LoadingScreen />
    );

  /* -------------------------
     Main render
     ------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1020] to-[#081024] dark:from-[#080810] dark:to-[#05060a] text-slate-100">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 backdrop-blur bg-black/20 border-b border-border">
        <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav(-1)}
              className="p-2 rounded-md hover:bg-white/5 transition"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold tracking-wide">DevRoom</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="p-2 rounded-md hover:bg-white/5 transition"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <SunMedium className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Profile icon -> route to profile */}
            <Link to="/profile" className="relative">
              <div
                className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border-2 ${
                  profile?.is_pro
                    ? "border-yellow-400 shadow-[0_0_12px_rgba(255,200,60,0.12)]"
                    : "border-slate-600"
                } bg-[#0f1724]`}
                title="Profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-slate-300" />
                )}
                {profile?.is_pro && (
                  <span className="absolute -bottom-0.5 right-0 transform translate-x-1/2 translate-y-1/2 bg-gradient-to-br from-yellow-400 to-amber-500 p-1 rounded-full shadow" />
                )}
              </div>
            </Link>
          </div>
        </nav>
      </header>

      {/* PAGE CONTENT */}
      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Profile Card */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.28 }}
          >
            <Card className="p-6 rounded-2xl bg-[#11121a] border border-[#1f2937] shadow-xl">
              <div className="flex items-center gap-4">
                <div
                  className={`relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-4 ${
                    profile?.is_pro ? "border-yellow-400" : "border-slate-600"
                  } shadow-md`}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <User className="w-8 h-8 text-white/80" />
                    </div>
                  )}
                  {/* pro ring glow */}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {user?.user_metadata.display_name ||
                        user?.user_metadata.name ||
                        "Anonymous"}
                    </h2>
                    {profile?.is_pro ? (
                      <div className="flex items-center gap-1 text-yellow-300">
                        <Crown className="w-4 h-4" />
                        <span className="text-xs font-medium">Pro</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs px-2 py-0.5 rounded bg-white/3">
                        Free
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/2 rounded-lg">
                  <div className="text-xs text-muted-foreground">Joined</div>
                  <div className="text-sm font-medium">
                    {fmtDate(user?.confirmed_at)}
                  </div>
                </div>
                <div className="p-3 bg-white/2 rounded-lg">
                  <div className="text-xs text-muted-foreground">
                    Last active
                  </div>
                  <div className="text-sm font-medium">
                    {fmtDate(user?.last_sign_in_at)}
                  </div>
                </div>
              </div>

              {/* Edit form */}
              <div className="mt-6 space-y-3">
                <label className="block text-xs text-muted-foreground">
                  Display name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-transparent border border-[#2a2a3a] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                />

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">
                    Avatar
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setAvatarFile(f);
                      }}
                      className="hidden"
                    />
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="w-12 h-12 rounded-md object-cover"
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Save profile"}
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

              {/* Pro CTA */}
              <div className="mt-6 border-t border-[#222] pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Pro Subscription</div>
                    <div className="text-xs text-muted-foreground">
                      Unlock longer retention and premium features
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!profile?.is_pro ? (
                      <Button onClick={() => nav("/subscribe")}>Upgrade</Button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-yellow-300">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="mt-4 text-sm">
                <Link to="/contact" className="text-primary hover:underline">
                  Contact support / feedback
                </Link>
              </div>
            </Card>
          </motion.div>

          {/* Middle: Rooms list */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.32 }}
            className="lg:col-span-2"
          >
            <Card className="p-4 rounded-2xl bg-[#0f1724] border border-[#1f2937] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Rooms</h3>
                <div className="text-sm text-muted-foreground">
                  Total: {rooms.length}
                </div>
              </div>

              {/* room list */}
              <div className="space-y-3">
                {rooms.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    You haven't created any rooms yet.
                    <div className="mt-3">
                      <CreateRoomDialog>
                        <Button size="lg" className="gap-2">
                          <span className="flex items-center gap-2">
                            <RocketIcon /> Create your first room
                          </span>
                        </Button>
                      </CreateRoomDialog>
                    </div>
                  </div>
                )}

                {rooms.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-[#23232b]"
                  >
                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Created: {fmtDate(r.created_at)} • Retention:{" "}
                        {r.expiry_hours
                          ? `${r.expiry_hours}h`
                          : profile?.is_pro
                          ? "No expiry"
                          : "24h (default)"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* retention dropdown */}
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleSetExpiryOrDelete(r.id, val, false);
                          }}
                          value={r.expiry_hours ?? ""}
                          className="bg-[#0b1220] border border-[#222733] px-2 py-1 rounded text-sm"
                        >
                          <option value="">Default / No change</option>
                          {retentionOptions.map((opt) => (
                            <option key={opt.hours} value={opt.hours}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* delete (confirm flow) */}
                      <button
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="p-2 rounded-md hover:bg-red-600/20 transition text-red-400"
                        title="Delete room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Delete confirmation modal (simple) */}
              {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#0b1220] rounded-xl p-6 w-[95%] max-w-md border border-[#2a2a3a] shadow-xl"
                  >
                    <h4 className="text-lg font-semibold">Delete room</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Are you sure you want to delete this room? This action is
                      permanent.
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        onClick={() =>
                          handleSetExpiryOrDelete(
                            confirmDeleteId,
                            undefined,
                            true
                          )
                        }
                        className="bg-red-600"
                      >
                        Delete permanently
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmDeleteId(null)}
                      >
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
    </div>
  );
}
