export function isKimiOAuthEnabled(): boolean {
  return Boolean(import.meta.env.VITE_KIMI_AUTH_URL && import.meta.env.VITE_APP_ID);
}

export function buildKimiOAuthUrl(origin = window.location.origin): string | null {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  if (!kimiAuthUrl || !appID) return null;

  const redirectUri = `${origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}
