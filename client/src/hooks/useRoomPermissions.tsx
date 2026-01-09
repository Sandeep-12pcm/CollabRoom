import { useState, useEffect } from "react";

export interface RoomPermissions {
  allow_guests_edit: boolean;
  allow_guests_create_pages: boolean;
  allow_guests_delete_pages: boolean;
}

const DEFAULT_PERMISSIONS: RoomPermissions = {
  allow_guests_edit: true,
  allow_guests_create_pages: true,
  allow_guests_delete_pages: false,
};

export function useRoomPermissions(
  roomId: string | null,
  isOwner: boolean
): RoomPermissions & { isOwner: boolean } {
  const [permissions, setPermissions] = useState<RoomPermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    if (!roomId) return;

    // Try to load permissions from localStorage
    const stored = localStorage.getItem(`room_permissions_${roomId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPermissions({
          allow_guests_edit: parsed.allow_guests_edit ?? true,
          allow_guests_create_pages: parsed.allow_guests_create_pages ?? true,
          allow_guests_delete_pages: parsed.allow_guests_delete_pages ?? false,
        });
      } catch {
        setPermissions(DEFAULT_PERMISSIONS);
      }
    } else {
      setPermissions(DEFAULT_PERMISSIONS);
    }
  }, [roomId]);

  // Owners always have full permissions
  if (isOwner) {
    return {
      allow_guests_edit: true,
      allow_guests_create_pages: true,
      allow_guests_delete_pages: true,
      isOwner: true,
    };
  }

  return {
    ...permissions,
    isOwner: false,
  };
}
