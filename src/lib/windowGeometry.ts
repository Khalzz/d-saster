export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

function storageKey(id: string) {
  return `window-geometry:${id}`;
}

export function loadWindowGeometry(id: string): WindowGeometry | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWindowGeometry(id: string, geometry: WindowGeometry) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(geometry));
  } catch { /* ignore */ }
}
