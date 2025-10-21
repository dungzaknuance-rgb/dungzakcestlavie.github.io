// Netlify Function (CommonJS)
// Requires env vars: REPO_OWNER, REPO_NAME, DEFAULT_BRANCH, GITHUB_TOKEN
const fetch = (...a) => import('node-fetch').then(({default: f}) => f(...a));

exports.handler = async (event, context) => {
  try {
    if (!context.clientContext || !context.clientContext.user) {
      return { statusCode: 401, body: 'Unauthorized' };
    }
    const { REPO_OWNER, REPO_NAME, DEFAULT_BRANCH='main', GITHUB_TOKEN } = process.env;
    if (!REPO_OWNER || !REPO_NAME || !GITHUB_TOKEN) {
      return { statusCode: 500, body: 'Missing env vars' };
    }
    const body = JSON.parse(event.body || '{}');
    const fn = body._fn;

    async function gh(path, method='GET', payload=null){
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`, {
        method,
        headers:{
          'Accept':'application/vnd.github+json',
          'Authorization':`Bearer ${GITHUB_TOKEN}`,
          'User-Agent':'netlify-fn'
        },
        body: payload ? JSON.stringify(payload) : null
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    }

    if (fn === 'getContent') {
      const { path } = body;
      try {
        const j = await gh(`contents/${path}`);
        const text = Buffer.from(j.content, 'base64').toString('utf8');
        return { statusCode: 200, body: JSON.stringify({ sha: j.sha, text }) };
      } catch {
        return { statusCode: 200, body: JSON.stringify({ sha: null, text: '' }) };
      }
    }

    if (fn === 'putContent') {
      const { path, text, contentBase64, sha, message, isBinary } = body;
      const content = isBinary ? contentBase64 : Buffer.from(text || '', 'utf8').toString('base64');
      const payload = { message: message || `update ${path}`, content, branch: DEFAULT_BRANCH };
      if (sha) payload.sha = sha;
      const j = await gh(`contents/${path}`, 'PUT', payload);
      return { statusCode: 200, body: JSON.stringify({ ok:true, sha:j.content.sha }) };
    }

    return { statusCode: 400, body: 'Bad Request' };
  } catch (e) {
    return { statusCode: 500, body: e.toString() };
  }
};
