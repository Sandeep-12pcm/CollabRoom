import express from "express";
import http from "http";
import { createClient } from "@supabase/supabase-js";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import aiRoute from "./routes/ai-code-assistant";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN!;
const PORT = Number(process.env.PORT);

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const app = express();
app.use(cors({
  origin: CLIENT_ORIGIN,  // allow frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use('/api/ai-code-assistant', aiRoute);
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});
const currentEditors = new Map<string, { user_id: string; display_name: string }>();

/**
 * Authenticate socket using Supabase access token sent in the handshake:
 * client passes: io(SOCKET_URL, { auth: { token: access_token } })
 */
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || "").split(" ")[1];
    if (!token) return next(new Error("Authentication error"));

    // validate token and get user
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return next(new Error("Authentication error"));

    // attach user to socket
    socket.data.user = data.user;
    return next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user;
  console.log("socket connected", user?.id);

  socket.on("join-page", async (pageId: string, roomId?: string) => {
    // join socket room for page-level events
    socket.join(pageId);
    console.log(`User ${user.id} joining room ${roomId}`);

    // optional: upsert presence in room_participants (server uses service role - RLS bypass)
    if (roomId && user?.id) {
      console.log(`User ${user.id} joining room ${roomId}`);
      await supabaseAdmin
        .from("room_participants")
        .upsert(
          {
            room_id: roomId,
            user_id: user.id,
            display_name: user.user_metadata?.display_name || user.email,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "room_id, user_id" }
        );
      // notify other clients in the room
      io.to(pageId).emit("participant-joined", { user_id: user.id, display_name: user.user_metadata?.display_name || user.email });
    }
  });

    // 🔒 Track who is editing (in-memory, simple map)

  // When a user starts editing
  socket.on("editing-started", ({ pageId, user_id, display_name }) => {
    if (!pageId || !user_id) return;
    currentEditors.set(pageId, { user_id, display_name });
    console.log(`🟢 ${display_name} started editing page ${pageId}`);
    // Notify everyone else in that page room
    socket.to(pageId).emit("editing-started", { user_id, display_name });
  });

  // When a user stops editing
  socket.on("editing-stopped", ({ pageId }) => {
    if (!pageId) return;
    const prev = currentEditors.get(pageId);
    if (prev) {
      console.log(`🔵 ${prev.display_name} stopped editing page ${pageId}`);
      currentEditors.delete(pageId);
    }
    // Notify everyone else
    socket.to(pageId).emit("editing-stopped", { pageId });
  });

  // leaving page room
  socket.on("leave-page", (pageId: string) => {
    socket.leave(pageId);
    // you can optionally mark last_seen or remove presence here
  });

  // live typing broadcast
  socket.on("content-change", ({ pageId, content }: { pageId: string; content: any }) => {
    // broadcast to everyone else in the page
    socket.to(pageId).emit("content-change", { pageId, content, from: user.id });
  });

  // cursor positions
  socket.on("cursor-update", ({ pageId, cursor }) => {
    socket.to(pageId).emit("cursor-update", { user_id: user.id, cursor });
  });

  // final save (client can emit periodically or on unload); server persists & writes page_history
  socket.on("save-page", async ({ pageId, content }: { pageId: string; content: string }) => {
    try {
      // update pages
      await supabaseAdmin.from("pages").update({ content, updated_at: new Date().toISOString() }).eq("id", pageId);
      // insert into page_history for audit
      await supabaseAdmin.from("page_history").insert({
        page_id: pageId,
        content,
        created_by: user?.id || null,
      });

      // notify subscribers (optional if you also rely on Supabase realtime)
      io.to(pageId).emit("page-saved", { pageId, savedAt: new Date().toISOString(), savedBy: user.id });
    } catch (err) {
      console.error("save-page error:", err);
      socket.emit("save-error", { message: "Failed to save page" });
    }
  });

    socket.on("disconnect", () => {
    console.log("socket disconnected", user?.id);

    // Auto release edit lock if they were editing
    for (const [pageId, editor] of currentEditors.entries()) {
      if (editor.user_id === user?.id) {
        currentEditors.delete(pageId);
        io.to(pageId).emit("editing-stopped", { pageId });
        console.log(`🔴 Released edit lock for ${editor.display_name} on ${pageId}`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
