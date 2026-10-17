// Start van de GitHub-login voor het beheer op /admin.
// Nodig in Vercel: GITHUB_CLIENT_ID en GITHUB_CLIENT_SECRET van een GitHub OAuth App.
import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('GITHUB_CLIENT_ID ontbreekt in de Vercel-instellingen.');
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `https://${host}/api/callback`,
    scope: 'repo',
    state,
  });
  res.setHeader('Set-Cookie', `decap_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
