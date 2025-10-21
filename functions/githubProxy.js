exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: cors(),
        body: 'ok'
      };
    }

    const { path, message, contentBase64, branch, token, isUpdate } = JSON.parse(event.body || '{}');

    if (!token) return json(401, { error: 'Missing token' });
    if (!path || !message || !branch) return json(400, { error: 'Missing fields' });

    const owner = 'dungzakcestlavie';
    const repo  = 'dungzakcestlavie.github.io';

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    let sha;
    if (isUpdate) {
      // 존재 여부/sha 조회
      const res = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (res.status === 200) {
        const data = await res.json();
        sha = data.sha;
      }
    }

    // 생성/수정
    const put = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: contentBase64,
        branch,
        sha // 존재할 때만 포함 → 422 방지
      })
    });

    const out = await put.json();
    if (put.status >= 400) {
      return json(put.status, out);
    }
    return json(200, out);

  } catch (e) {
    return json(500, { error: String(e) });
  }
};

function json(code, obj) {
  return { statusCode: code, headers: cors(), body: JSON.stringify(obj) };
}
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };
}
