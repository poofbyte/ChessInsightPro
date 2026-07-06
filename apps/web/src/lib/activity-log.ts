const API = "/api/activity/log";

export async function logActivity(type: string, name?: string, details?: Record<string, any>) {
  try {
    const { useAuthStore } = await import("@/app/store");
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ activity_type: type, activity_name: name || "", details: details || {} }),
    });
  } catch {}
}
