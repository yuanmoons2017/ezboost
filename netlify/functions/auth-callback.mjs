// Steam OpenID Callback — verifies the login and creates a session
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const url = new URL(req.url);
  const params = url.searchParams;
  const siteUrl = `${url.protocol}//${url.host}`;

  // Verify the OpenID response with Steam
  const verifyParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    verifyParams.set(key, value);
  }
  verifyParams.set('openid.mode', 'check_authentication');

  const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  });

  const verifyBody = await verifyRes.text();

  if (!verifyBody.includes('is_valid:true')) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${siteUrl}/login.html?error=steam_verification_failed` },
    });
  }

  // Extract Steam ID from claimed_id
  const claimedId = params.get('openid.claimed_id');
  const steamIdMatch = claimedId && claimedId.match(/\/id\/(\d+)$/);
  if (!steamIdMatch) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${siteUrl}/login.html?error=invalid_steam_id` },
    });
  }

  const steamId = steamIdMatch[1];

  // Fetch Steam profile using Steam Web API
  const steamApiKey = Netlify.env.get('STEAM_API_KEY');
  let profile = { steamId, personaname: `User ${steamId}`, avatarfull: '', profileurl: '' };

  if (steamApiKey) {
    try {
      const profileRes = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`
      );
      const profileData = await profileRes.json();
      const player = profileData?.response?.players?.[0];
      if (player) {
        profile = {
          steamId: player.steamid,
          personaname: player.personaname,
          avatarfull: player.avatarfull,
          avatarmedium: player.avatarmedium,
          avatar: player.avatar,
          profileurl: player.profileurl,
          loccountrycode: player.loccountrycode || '',
          realname: player.realname || '',
          timecreated: player.timecreated || 0,
          personastate: player.personastate || 0,
        };
      }
    } catch (e) {
      console.error('Failed to fetch Steam profile:', e);
    }
  }

  // Create a session
  const sessionId = crypto.randomUUID();
  const sessions = getStore({ name: 'sessions', consistency: 'strong' });

  await sessions.setJSON(sessionId, {
    steamId,
    profile,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Also save the user profile
  const users = getStore('users');
  await users.setJSON(`steam:${steamId}`, {
    ...profile,
    lastLogin: Date.now(),
  });

  // Set session cookie and redirect to dashboard
  context.cookies.set({
    name: 'cb_session',
    value: sessionId,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `${siteUrl}/` },
  });
};

export const config = {
  path: '/api/auth/callback',
};
