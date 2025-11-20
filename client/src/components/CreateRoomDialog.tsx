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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createRoom } from "@/utils/createRoom";

interface CreateRoomDialogProps {
  children?: ReactNode;
}

export const CreateRoomDialog = ({ children }: CreateRoomDialogProps) => {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div id="create-room-trigger">
          {children ? (
            children
          ) : (
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Room
            </Button>
          )}
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new room</DialogTitle>
          <DialogDescription>
            Give your coding room a name to start collaborating.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) =>
            createRoom({
              e,
              roomName,
              setLoading,
              toast,
              navigate,
              setOpen,
            })
          }
          className="space-y-4"
        >
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
          <div className="pt-2 text-center text-sm text-muted-foreground">
            <span>Have a code?</span>{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => {
                setOpen(false);
                // Open JoinRoomDialog?
                document.getElementById("join-room-trigger")?.click();
              }}
            >
              Join a room
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
