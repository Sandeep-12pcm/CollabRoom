import { useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CreateRoomDialogProps {
  children?: ReactNode; // ✅ optional custom trigger
}

export const CreateRoomDialog = ({ children }: CreateRoomDialogProps) => {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateRoomCode = (length = 6) => {
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create a room.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const roomCode = generateRoomCode(6);

      const { data: room, error } = await supabase
        .from("rooms")
        .insert({
          name: roomName,
          created_by: user.id,
          room_code: roomCode,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Room created!",
        description: `Share this code with others to join: ${roomCode}`,
      });

      setOpen(false);
      navigate(`/room/${room.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* ✅ Use custom trigger if provided, else fallback to styled default */}
        {children ? (
          children
        ) : (
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Room
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new room</DialogTitle>
          <DialogDescription>
            Give your coding room a name to start collaborating
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              placeholder="My Awesome Project"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
