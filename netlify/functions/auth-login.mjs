// Steam OpenID 2.0 Login — redirects user to Steam for authentication
export default async (req) => {
  const url = new URL(req.url);
  const siteUrl = `${url.protocol}//${url.host}`;
  const returnUrl = `${siteUrl}/api/auth/callback`;

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': siteUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;

  return new Response(null, {
    status: 302,
    headers: { Location: steamLoginUrl },
  });
};

export const config = {
  path: '/api/auth/login',
};
