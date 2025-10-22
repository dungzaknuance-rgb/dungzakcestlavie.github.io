<!-- 🪞 admin-artworks.js — DUNGZAK CESTLAVIE Artworks Manager -->
<script>
/* 🌕 공통 변수 설정 */
const ghUser = "dungzakcestlavie";  // 깃허브 사용자명
const ghRepo = "dungzakcestlavie.github.io"; // 리포지토리 이름
const ghBranch = "main";
const token = localStorage.getItem("token"); // Personal Access Token
const artworksPath = "artworks.json";

/* 📤 작품 업로드 */
async function uploadArtwork() {
  const series = document.querySelector("#series").value;
  const id = document.querySelector("#artworkId").value;
  const title = document.querySelector("#title").value;
  const year = document.querySelector("#year").value;
  const medium = document.querySelector("#medium").value;
  const size = document.querySelector("#size").value;
  const fileInput = document.querySelector("#imageFile").files[0];
  
  if (!fileInput) return alert("이미지를 선택해주세요.");
  const imgFileName = `${id}.jpg`;
  
  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64 = event.target.result.split(",")[1];
    const imagePath = `assets/artworks/${imgFileName}`;

    await uploadToGitHub(imagePath, base64, `upload ${title}`);
    await updateArtworksJSON({ id, series, title, year, medium, size, image: imagePath });
    
    alert("✅ 작품이 업로드되었습니다.");
    clearForm();
  };
  reader.readAsDataURL(fileInput);
}

/* 🗑️ 작품 삭제 */
async function deleteArtwork() {
  const id = prompt("삭제할 작품의 ID를 입력하세요 (예: Dungzak-1)");
  if (!id) return;
  
  const json = await fetch(`https://raw.githubusercontent.com/${ghUser}/${ghRepo}/${ghBranch}/${artworksPath}`).then(r=>r.json());
  const updated = json.filter(a => a.id !== id);
  
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(updated, null, 2))));
  await fetch(`https://api.github.com/repos/${ghUser}/${ghRepo}/contents/${artworksPath}`, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `delete ${id}`,
      content: encoded,
      sha: await getSHA(artworksPath)
    })
  });
  
  alert(`🗑️ ${id} 삭제 완료`);
}

/* 🔄 다음 작품 바로 업로드 */
function nextArtwork() {
  const current = document.querySelector("#artworkId").value;
  const nextNum = parseInt(current.split("-")[1]) + 1;
  document.querySelector("#artworkId").value = `Dungzak-${nextNum}`;
  document.querySelector("#title").value = "";
  document.querySelector("#medium").value = "";
  document.querySelector("#size").value = "";
  document.querySelector("#imageFile").value = "";
  alert("🎨 다음 작품 업로드 준비 완료!");
}

/* 🧠 헬퍼 함수들 */
async function uploadToGitHub(path, base64, msg) {
  const sha = await getSHA(path);
  await fetch(`https://api.github.com/repos/${ghUser}/${ghRepo}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg, content: base64, branch: ghBranch, sha })
  });
}

async function updateArtworksJSON(newArt) {
  const res = await fetch(`https://raw.githubusercontent.com/${ghUser}/${ghRepo}/${ghBranch}/${artworksPath}`);
  const artworks = await res.json();
  const idx = artworks.findIndex(a => a.id === newArt.id);
  if (idx >= 0) artworks[idx] = newArt; else artworks.push(newArt);
  
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(artworks, null, 2))));
  await fetch(`https://api.github.com/repos/${ghUser}/${ghRepo}/contents/${artworksPath}`, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `update ${newArt.id}`,
      content: encoded,
      sha: await getSHA(artworksPath)
    })
  });
}

async function getSHA(path) {
  const res = await fetch(`https://api.github.com/repos/${ghUser}/${ghRepo}/contents/${path}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha;
}

function clearForm() {
  document.querySelector("#title").value = "";
  document.querySelector("#medium").value = "";
  document.querySelector("#size").value = "";
  document.querySelector("#imageFile").value = "";
}
</script>
