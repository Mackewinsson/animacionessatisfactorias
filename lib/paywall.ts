const STORAGE_PREFIX = "unlock_";

function storageKey(renderId: string, userId?: string | null): string {
  return userId
    ? `${STORAGE_PREFIX}${userId}_${renderId}`
    : `${STORAGE_PREFIX}${renderId}`;
}

export function getStoredUnlockToken(
  renderId: string,
  userId?: string | null,
): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(storageKey(renderId, userId));
}

export function storeUnlockToken(
  renderId: string,
  token: string,
  userId?: string | null,
): void {
  sessionStorage.setItem(storageKey(renderId, userId), token);
}

export function isUnlocked(renderId: string, userId?: string | null): boolean {
  return Boolean(getStoredUnlockToken(renderId, userId));
}

export interface UnlockResponse {
  unlocked: boolean;
  token?: string;
  paymentRequired?: boolean;
  message?: string;
}

export async function requestUnlock(
  renderId: string,
  sessionId?: string,
  userId?: string | null,
): Promise<UnlockResponse> {
  const res = await fetch("/api/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ renderId, sessionId }),
    credentials: "same-origin",
  });
  const data = (await res.json()) as UnlockResponse;
  if (res.ok && data.unlocked && data.token) {
    storeUnlockToken(renderId, data.token, userId);
    return data;
  }
  return {
    unlocked: false,
    paymentRequired: res.status === 402 || data.paymentRequired,
    message:
      data.message ??
      (res.status === 401
        ? "Sign in required."
        : "Payment required to download."),
  };
}
