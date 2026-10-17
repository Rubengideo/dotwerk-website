// Ruilt de GitHub-code om voor een token en geeft die door aan het Decap-venster.
function page(status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  return `<!doctype html><html><body><script>
(function () {
  var msg = ${JSON.stringify(message)};
  function receive(e) {
    window.removeEventListener('message', receive, false);
    window.opener.postMessage(msg, e.origin);
    setTimeout(function () { window.close(); }, 300);
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const { code, state } = req.query;
  const cookie = (req.headers.cookie || '').match(/(?:^|;\s*)decap_state=([a-f0-9]+)/);
  if (!code || !state || !cookie || cookie[1] !== state) {
    res.status(400).send(page('error', { message: 'Ongeldige login-aanvraag. Probeer opnieuw.' }));
    return;
  }
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const data = await r.json();
    if (!data.access_token) throw new Error(data.error_description || 'Geen token ontvangen');
    res.setHeader('Set-Cookie', 'decap_state=; Path=/api; Max-Age=0');
    res.status(200).send(page('success', { token: data.access_token, provider: 'github' }));
  } catch (err) {
    res.status(500).send(page('error', { message: String(err.message || err) }));
  }
}
