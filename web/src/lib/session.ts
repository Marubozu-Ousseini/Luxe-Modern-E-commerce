import { subscribeToAuthState, signOutFirebase } from "@/lib/firebaseClient";

export const AUTH_LOGGED_IN_KEY = "malafaareh_logged_in";
export const AUTH_EMAIL_KEY = "malafaareh_email";
export const AUTH_CHANGED_EVENT = "malafaareh-auth-changed";

let startedMirror = false;

export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

function mirrorAuthToLocalStorage(): void {
  if (typeof window === "undefined") return;
  if (startedMirror) return;
  startedMirror = true;

  subscribeToAuthState((user) => {
    try {
      if (user) {
        window.localStorage.setItem(AUTH_LOGGED_IN_KEY, "1");
        if (user.email) window.localStorage.setItem(AUTH_EMAIL_KEY, user.email);
      } else {
        window.localStorage.removeItem(AUTH_LOGGED_IN_KEY);
      }
    } catch {
      // ignore
    }
    notifyAuthChanged();
  });
}

// Kept for backwards compatibility with existing components.
// It now reflects Firebase Auth state (mirrored into localStorage).
export function isLoggedIn(): boolean {
  mirrorAuthToLocalStorage();
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUTH_LOGGED_IN_KEY) === "1";
  } catch {
    return false;
  }
}

export async function logoutEverywhere(): Promise<void> {
  // Sign out of Firebase first (source of truth)
  try {
    await signOutFirebase();
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(AUTH_LOGGED_IN_KEY);
      window.localStorage.removeItem(AUTH_EMAIL_KEY);
    } catch {
      // ignore
    }
    notifyAuthChanged();
  }

  // Best-effort server logout (clears httpOnly cookie in the API service).
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  }
}
