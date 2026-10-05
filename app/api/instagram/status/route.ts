import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

function keyFromSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest();
}

function decrypt(value: string, secret: string) {
  const [iv64, tag64, encrypted64] = value.split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    keyFromSecret(secret),
    iv64 ? Buffer.from(iv64, "base64url") : Buffer.alloc(0)
  );
  decipher.setAuthTag(Buffer.from(tag64, "base64url"));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(encrypted64, "base64url")),
      decipher.final()
    ]).toString("utf8")
  );
}

export async function GET(req: Request) {
  const secret = process.env.INSTAGRAM_APP_SECRET;
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)ig_connection=([^;]+)/)?.[1];
  if (!secret || !cookie) return NextResponse.json({ connected: false });

  try {
    const data = decrypt(decodeURIComponent(cookie), secret);
    return NextResponse.json({
      connected: Boolean(data.accessToken),
      username: data.username,
      accountType: data.accountType,
      userId: data.userId,
      expiresAt: data.expiresAt
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
