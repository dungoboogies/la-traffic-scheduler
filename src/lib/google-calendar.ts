import { google } from "googleapis";
import { prisma } from "./prisma";

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  );
}

export function getGoogleAuthUrl() {
  const oauth = getOAuthClient();
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly",
    ],
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);
  return tokens;
}

export async function getAuthedClient(userId: string) {
  const auth = await prisma.googleAuth.findUnique({ where: { userId } });
  if (!auth) return null;

  const oauth = getOAuthClient();
  oauth.setCredentials({
    refresh_token: auth.refreshToken,
    access_token: auth.accessToken || undefined,
    expiry_date: auth.expiresAt?.getTime(),
  });

  // Refresh if expired
  const tokenInfo = await oauth.getAccessToken();
  if (tokenInfo.token && tokenInfo.token !== auth.accessToken) {
    await prisma.googleAuth.update({
      where: { userId },
      data: {
        accessToken: tokenInfo.token,
        expiresAt: new Date(Date.now() + 3500 * 1000),
      },
    });
  }

  return oauth;
}

export async function fetchCalendarEvents(userId: string, startDate: Date, endDate: Date) {
  const auth = await getAuthedClient(userId);
  if (!auth) return [];

  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  });

  return (res.data.items || []).filter(
    (e) => e.start?.dateTime && e.end?.dateTime
  );
}
