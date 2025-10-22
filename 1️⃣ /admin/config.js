// admin/config.js
// GitHub Actions 자동 트리거 & 저장소 연동 설정
const CONFIG = {
  owner: "dungzakcestlavie",
  repo: "dungzakcestlavie.github.io",
  branch: "main",
  tokenKey: "gh_token", // localStorage에 저장되는 key
};

// 브라우저에서 localStorage에 저장된 토큰 자동 적용
const token = localStorage.getItem(CONFIG.tokenKey) || "";
if (token) console.log("🔑 GitHub Token Loaded.");

// 보고서 저장 함수
async function saveReportToGitHub(report) {
  const path = `data/reports.json`;
  const api = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  const res = await fetch(api, { headers });
  const data = await res.json();
  const sha = data.sha;
  let json = JSON.parse(atob(data.content.replace(/\n/g, "")));
  json.reports.push(report);

  const update = {
    message: `Add new report: ${report.id}`,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(json, null, 2)))),
    branch: CONFIG.branch,
    sha,
  };

  await fetch(api, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });

  alert("✅ Report saved & workflow triggered!");
}
