import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CreateRoomDialog } from "./CreateRoomDialog";

export const FinalCTA = () => (
  <section className="py-28 text-center">
    <h2 className="text-4xl font-bold mb-6">Start Collaborating in Seconds</h2>
    <p className="text-muted-foreground mb-10">
      No signup required. Free forever for basic rooms.
    </p>

    <CreateRoomDialog>
      <Button size="lg" className="bg-gradient-primary group">
        Create a Room
        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
      </Button>
    </CreateRoomDialog>
  </section>
);
