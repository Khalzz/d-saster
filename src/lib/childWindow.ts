import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { loadWindowGeometry, saveWindowGeometry } from "./windowGeometry";

export interface OpenChildWindowOptions {
  title?: string;
  width?: number;
  height?: number;
  /** If set, this window's position & size are restored on open and saved as it's moved/resized. */
  rememberGeometryKey?: string;
}

// Opens a new native window pointed at an in-app route. Every child window
// gets a "child-" label so it automatically picks up the "child-window"
// Tauri capability (window controls, no window-creation rights of its own).
export function openChildWindow(path: string, options: OpenChildWindowOptions = {}) {
  const label = `child-${crypto.randomUUID()}`;
  const saved = options.rememberGeometryKey ? loadWindowGeometry(options.rememberGeometryKey) : null;

  const child = new WebviewWindow(label, {
    url: path,
    title: options.title ?? "d-saster",
    width: saved?.width ?? options.width ?? 900,
    height: saved?.height ?? options.height ?? 600,
    x: saved?.x,
    y: saved?.y,
    decorations: false,
    dragDropEnabled: false,
  });

  child.once("tauri://error", (e) => {
    console.error(`Failed to open child window "${label}":`, e);
  });

  if (options.rememberGeometryKey) {
    const key = options.rememberGeometryKey;
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        Promise.all([child.scaleFactor(), child.outerPosition(), child.outerSize()])
          .then(([scale, pos, size]) => {
            const logicalPos = pos.toLogical(scale);
            const logicalSize = size.toLogical(scale);
            saveWindowGeometry(key, { x: logicalPos.x, y: logicalPos.y, width: logicalSize.width, height: logicalSize.height });
          })
          .catch(() => {});
      }, 300);
    };
    child.onMoved(scheduleSave);
    child.onResized(scheduleSave);
  }

  return child;
}
