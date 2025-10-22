/* === Cosmic Resonance Sound Engine — Lumera Edition === */
/* Designed for 등작 燈酌 DUNGZAK CESTLAVIE */

const btnPlay = document.getElementById('soundBtn');
const btnStop = document.getElementById('soundStopBtn');
let ac, nodes = null, isPlaying = false;

function createCosmicResonance() {
  ac = new (window.AudioContext || window.webkitAudioContext)();

  // 🔭 Oscillators — 기본 주파수 기반으로 맑고 고요한 우주음
  const base = ac.createOscillator();
  base.type = 'sine';
  base.frequency.value = 222; // 중심 공명 (명상용 주파수)

  const overtone = ac.createOscillator();
  overtone.type = 'sine';
  overtone.frequency.value = 444; // 조화음

  const shimmer = ac.createOscillator();
  shimmer.type = 'triangle';
  shimmer.frequency.value = 0.25; // 천천히 진동하는 초저주파 (LFO)

  // 🌌 필터 및 공간감
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.8;

  const gain = ac.createGain();
  gain.gain.value = 0.0001;

  const lfoGain = ac.createGain();
  lfoGain.gain.value = 180;
  shimmer.connect(lfoGain).connect(filter.frequency);

  // 💫 Reverb-like 공간감 (딜레이)
  const delay = ac.createDelay();
  delay.delayTime.value = 0.5;
  const feedback = ac.createGain();
  feedback.gain.value = 0.25;
  delay.connect(feedback).connect(delay);

  // 연결 구조
  base.connect(gain);
  overtone.connect(gain);
  gain.connect(filter);
  filter.connect(delay);
  delay.connect(ac.destination);
  filter.connect(ac.destination);

  // 🌠 시간에 따라 부드럽게 시작
  base.start();
  overtone.start();
  shimmer.start();
  gain.gain.exponentialRampToValueAtTime(0.08, ac.currentTime + 2.5);

  nodes = { base, overtone, shimmer, gain, delay, feedback };
  isPlaying = true;
}

function stopCosmicResonance() {
  if (!isPlaying) return;
  const { base, overtone, shimmer, gain } = nodes;
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.5);
  setTimeout(() => {
    try {
      base.stop();
      overtone.stop();
      shimmer.stop();
      ac.close();
    } catch {}
    nodes = null;
    isPlaying = false;
  }, 1600);
}

btnPlay.addEventListener('click', async () => {
  if (isPlaying) return;
  createCosmicResonance();
  btnPlay.disabled = true;
  btnStop.disabled = false;
});

btnStop.addEventListener('click', () => {
  stopCosmicResonance();
  btnPlay.disabled = false;
  btnStop.disabled = true;
});
