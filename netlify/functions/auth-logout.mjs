// Logs the user out by deleting the session
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const url = new URL(req.url);
  const siteUrl = `${url.protocol}//${url.host}`;
  const sessionId = context.cookies.get('cb_session');

  if (sessionId) {
    const sessions = getStore({ name: 'sessions', consistency: 'strong' });
    await sessions.delete(sessionId);
  }

  context.cookies.delete('cb_session');

  return new Response(null, {
    status: 302,
    headers: { Location: `${siteUrl}/login.html` },
  });
};

export const config = {
  path: '/api/auth/logout',
};
