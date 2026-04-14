// Returns the current user's session/profile, or 401 if not logged in
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const sessionId = context.cookies.get('cb_session');
  if (!sessionId) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  const sessions = getStore({ name: 'sessions', consistency: 'strong' });
  const session = await sessions.get(sessionId, { type: 'json' });

  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      await sessions.delete(sessionId);
    }
    context.cookies.delete('cb_session');
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    profile: session.profile,
  });
};

export const config = {
  path: '/api/auth/me',
};
