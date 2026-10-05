// Remembers layout sizes the user dragged (column split, card heights) in the browser so they survive a reload.
// Without storage (private mode, blocked) the sizes only last until reload.

// Stored positive number, or undefined if nothing (valid) is stored
export function loadStoredNumber(key: string): number | undefined {
  try {
    const stored = Number(localStorage.getItem(key));
    return stored > 0 ? stored : undefined;
  } catch {
    return undefined;
  }
}

// undefined removes the entry (back to the default layout)
export function saveStoredNumber(key: string, value: number | undefined): void {
  try {
    if (value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(value));
    }
  } catch {
    // Without storage the size only lasts until reload
  }
}
