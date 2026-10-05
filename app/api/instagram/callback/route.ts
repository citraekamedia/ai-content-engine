import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

function keyFromSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(payload: string, secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString("base64url")).join(".");
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const baseUrl = process.env.APP_URL || requestUrl.origin;

  if (error) return NextResponse.redirect(new URL("/?instagram=error", baseUrl));

  const stateCookie = req.headers.get("cookie")?.match(/(?:^|;\s*)ig_oauth_state=([^;]+)/)?.[1];
  if (!state || !stateCookie || state !== decodeURIComponent(stateCookie)) {
    return NextResponse.redirect(new URL("/?instagram=state_error", baseUrl));
  }

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!code || !appId || !appSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/?instagram=config_error", baseUrl));
  }

  try {
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code.replace(/#_$/, "")
      })
    });

    const shortToken = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(shortToken.error_message || "Instagram token exchange failed");

    const tokenData = shortToken.data?.[0] || shortToken;
    const shortAccessToken = tokenData.access_token;
    const userId = tokenData.user_id;
    if (!shortAccessToken || !userId) throw new Error("Instagram tidak mengembalikan access token/user id.");

    const longUrl = new URL("https://graph.instagram.com/access_token");
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("access_token", shortAccessToken);

    const longResponse = await fetch(longUrl);
    const longToken = await longResponse.json();
    if (!longResponse.ok || !longToken.access_token) {
      throw new Error(longToken.error?.message || "Long-lived Instagram token exchange failed");
    }

    const profileUrl = new URL("https://graph.instagram.com/me");
    profileUrl.searchParams.set("fields", "id,username,account_type");
    profileUrl.searchParams.set("access_token", longToken.access_token);

    const profileResponse = await fetch(profileUrl);
    const profile = await profileResponse.json();
    if (!profileResponse.ok) throw new Error(profile.error?.message || "Gagal membaca profil Instagram.");

    const connection = encrypt(JSON.stringify({
      accessToken: longToken.access_token,
      userId: profile.id || userId,
      username: profile.username || "",
      accountType: profile.account_type || "",
      expiresAt: Date.now() + Number(longToken.expires_in || 5184000) * 1000
    }), appSecret);

    const response = NextResponse.redirect(
      new URL(`/?instagram=connected&username=${encodeURIComponent(profile.username || "")}`, baseUrl)
    );
    response.cookies.set("ig_oauth_state", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    response.cookies.set("ig_connection", connection, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/",
      maxAge: Math.min(Number(longToken.expires_in || 5184000), 5184000)
    });
    return response;
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    return NextResponse.redirect(new URL("/?instagram=error", baseUrl));
  }
}
