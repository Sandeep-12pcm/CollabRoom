import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const JoinRoomDialog = () => {
  const [open, setOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: room, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", roomCode.trim())
        .single();

      if (error || !room) {
        toast({
          title: "Invalid Room Code",
          description: "Please enter a valid room code.",
          variant: "destructive",
        });
        return;
      }

      setOpen(false);
      // ✅ Navigate using room.id, not the code
      navigate(`/room/${room.id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="gap-2">
          <Users className="h-5 w-5" />
          Join Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>
            Enter the room code to join an existing coding room
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              placeholder="Enter 6-digit room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Join Room
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
