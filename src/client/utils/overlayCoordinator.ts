// Only one overlay should ever be open: sidebar dialogs (SidebarModal), a player's played cards
// (OtherPlayer) and the log card overlay (LogMessageInspector).
// Each overlay registers with a close function; whoever opens closes all others first.

type RegisteredOverlay = {
  // Overlays with the same key manage their coexistence themselves (e.g. the card views of all players)
  key: string;
  close: () => void;
};

const overlays = new Map<symbol, RegisteredOverlay>();

// Returns the unregister function
export function registerOverlay(key: string, close: () => void): () => void {
  const id = Symbol(key);
  overlays.set(id, {key, close});
  return () => overlays.delete(id);
}

// Call before opening: closes all overlays with a different key
export function closeOtherOverlays(key: string): void {
  for (const overlay of overlays.values()) {
    if (overlay.key !== key) {
      overlay.close();
    }
  }
}
