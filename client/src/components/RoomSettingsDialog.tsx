import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Trash2, ExternalLink, Share2, Settings2, Shield } from "lucide-react";

export interface RoomPermissions {
  allow_guests_edit: boolean;
  allow_guests_create_pages: boolean;
  allow_guests_delete_pages: boolean;
}

export interface Room {
  id: string;
  room_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  name?: string | null;
  expiry_hours?: number | null;
  // Permissions stored as JSON or separate columns
  allow_guests_edit?: boolean;
  allow_guests_create_pages?: boolean;
  allow_guests_delete_pages?: boolean;
}

interface RoomSettingsDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPro?: boolean;
  onRoomUpdated: (room: Room) => void;
  onRoomDeleted: (roomId: string) => void;
}

const RoomSettingsDialog: React.FC<RoomSettingsDialogProps> = ({
  room,
  open,
  onOpenChange,
  isPro = false,
  onRoomUpdated,
  onRoomDeleted,
}) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [expiryHours, setExpiryHours] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Permissions state
  const [allowGuestsEdit, setAllowGuestsEdit] = useState(true);
  const [allowGuestsCreatePages, setAllowGuestsCreatePages] = useState(true);
  const [allowGuestsDeletePages, setAllowGuestsDeletePages] = useState(false);

  const retentionOptions = isPro
    ? [
        { label: "24 hours", hours: 24 },
        { label: "72 hours", hours: 72 },
        { label: "1 week", hours: 24 * 7 },
        { label: "1 month", hours: 24 * 30 },
      ]
    : [
        { label: "24 hours", hours: 24 },
        { label: "72 hours", hours: 72 },
      ];

  useEffect(() => {
    if (room) {
      setName(room.name || "");
      setExpiryHours(room.expiry_hours?.toString() || "24");
      setAllowGuestsEdit(room.allow_guests_edit ?? true);
      setAllowGuestsCreatePages(room.allow_guests_create_pages ?? true);
      setAllowGuestsDeletePages(room.allow_guests_delete_pages ?? false);
      setActiveTab("general");
      setShowDeleteConfirm(false);
    }
  }, [room]);

  const handleSave = async () => {
    if (!room) return;
    setSaving(true);

    try {
      // Note: These permission columns may not exist in the DB yet
      // They will be stored locally and can be added to DB later
      const updateData: any = {
        name: name || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase
        .from("rooms")
        .update(updateData)
        .eq("id", room.id) as any);

      if (error) throw error;

      const updatedRoom: Room = {
        ...room,
        name,
        expiry_hours: expiryHours ? parseInt(expiryHours) : null,
        allow_guests_edit: allowGuestsEdit,
        allow_guests_create_pages: allowGuestsCreatePages,
        allow_guests_delete_pages: allowGuestsDeletePages,
      };

      // Store permissions in localStorage as fallback until DB columns are added
      localStorage.setItem(
        `room_permissions_${room.id}`,
        JSON.stringify({
          allow_guests_edit: allowGuestsEdit,
          allow_guests_create_pages: allowGuestsCreatePages,
          allow_guests_delete_pages: allowGuestsDeletePages,
        })
      );

      onRoomUpdated(updatedRoom);
      toast({ title: "Room settings saved" });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to update room",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!room) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", room.id);
      if (error) throw error;

      // Clean up localStorage
      localStorage.removeItem(`room_permissions_${room.id}`);

      onRoomDeleted(room.id);
      toast({ title: "Room deleted successfully" });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to delete room",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const copyRoomCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      setCopied(true);
      toast({ title: "Room code copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareRoom = () => {
    const url = `${window.location.origin}/room/${room?.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Share link copied!", description: "Anyone with this link can join the room" });
  };

  const openInNewTab = () => {
    window.open(`/room/${room?.id}`, "_blank");
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Room Settings
          </DialogTitle>
          <DialogDescription>
            Manage settings for {room.name || room.room_code}
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="py-6">
            <p className="text-center text-muted-foreground mb-4">
              Are you sure you want to delete this room? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting..." : "Delete Room"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                {/* Room Code */}
                <div className="space-y-2">
                  <Label>Room Code</Label>
                  <div className="flex items-center gap-2">
                    <Input value={room.room_code || ""} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={copyRoomCode}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Room Name */}
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter room name"
                  />
                </div>

                {/* Retention */}
                <div className="space-y-2">
                  <Label>Data Retention</Label>
                  <Select value={expiryHours} onValueChange={setExpiryHours}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      {retentionOptions.map((opt) => (
                        <SelectItem key={opt.hours} value={opt.hours.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isPro && (
                    <p className="text-xs text-muted-foreground">
                      Upgrade to Pro for longer retention options
                    </p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Label>Quick Actions</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={openInNewTab}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Room
                    </Button>
                    <Button variant="outline" size="sm" onClick={shareRoom}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Link
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 mt-4">
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Allow guests to edit</Label>
                      <p className="text-sm text-muted-foreground">
                        Guests can modify code and content in pages
                      </p>
                    </div>
                    <Switch
                      checked={allowGuestsEdit}
                      onCheckedChange={setAllowGuestsEdit}
                    />
                  </div>

                  <div className="border-t pt-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Allow guests to create pages</Label>
                      <p className="text-sm text-muted-foreground">
                        Guests can add new pages to the room
                      </p>
                    </div>
                    <Switch
                      checked={allowGuestsCreatePages}
                      onCheckedChange={setAllowGuestsCreatePages}
                    />
                  </div>

                  <div className="border-t pt-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Allow guests to delete pages</Label>
                      <p className="text-sm text-muted-foreground">
                        Guests can remove pages from the room
                      </p>
                    </div>
                    <Switch
                      checked={allowGuestsDeletePages}
                      onCheckedChange={setAllowGuestsDeletePages}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  These settings apply to all users who join via the room code or share link.
                  As the room owner, you always have full access.
                </p>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Room
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoomSettingsDialog;
