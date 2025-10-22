/* === Ω.4 Cosmic Reactive Edition — Lumera for DUNGZAK CESTLAVIE === */

const btnPlay = document.getElementById('soundBtn');
const btnStop  = document.getElementById('soundStopBtn');

let ac, nodes = null, isPlaying = false;

// 전역 리액티브 신호 (시각 루프에서 읽음)
window.__cosmicEnergy = 0.0; // 0..1
window.__cosmicTone   = 0.5; // 0..1

function createEngine() {
  ac = new (window.AudioContext || window.webkitAudioContext)();

  // 기본 오실레이터
  const base = ac.createOscillator();  base.type = 'sine';     base.frequency.value = 222;
  const harm = ac.createOscillator();  harm.type = 'sine';     harm.frequency.value = 444;
  const lfo  = ac.createOscillator();  lfo.type  = 'triangle'; lfo.frequency.value = 0.22;

  const lfoGain = ac.createGain();     lfoGain.gain.value = 160;

  // 톤 필터 + 잔향
  const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = 0.8;

  const delay = ac.createDelay(); delay.delayTime.value = 0.42;
  const feedback = ac.createGain(); feedback.gain.value = 0.26;
  delay.connect(feedback).connect(delay);

  const gain = ac.createGain(); gain.gain.value = 0.0001;

  // 분석기 (시각화용)
  const analyser = ac.createAnalyser();
  analyser.fftSize = 512;
  const freqBins = new Uint8Array(analyser.frequencyBinCount);
  const timeBins = new Uint8Array(analyser.fftSize);

  // 연결
  lfo.connect(lfoGain).connect(filter.frequency);
  base.connect(gain);
  harm.connect(gain);
  gain.connect(filter);
  filter.connect(delay);
  filter.connect(ac.destination);
  delay.connect(ac.destination);

  // 분석기 분기
  filter.connect(analyser);

  // 시작
  base.start(); harm.start(); lfo.start();
  gain.gain.exponentialRampToValueAtTime(0.08, ac.currentTime + 2.5);

  // 에너지 업데이트 루프
  let rafId;
  const update = () => {
    analyser.getByteTimeDomainData(timeBins);
    analyser.getByteFrequencyData(freqBins);

    // RMS 에너지
    let sum = 0;
    for (let i = 0; i < timeBins.length; i++) {
      const v = (timeBins[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / timeBins.length); // ~0..1
    // 대역별 톤(저/중/고 평균)
    const n = freqBins.length;
    const lowAvg  = avg(freqBins, 0, Math.floor(n * 0.18))   / 255;
    const midAvg  = avg(freqBins, Math.floor(n*0.18), Math.floor(n*0.55)) / 255;
    const highAvg = avg(freqBins, Math.floor(n*0.55), n)     / 255;

    // 전역 신호 업데이트 (부드럽게)
    window.__cosmicEnergy = smooth(window.__cosmicEnergy, clamp(rms * 2.1, 0, 1), 0.12);
    window.__cosmicTone   = smooth(window.__cosmicTone,   clamp((midAvg*0.6 + highAvg*0.4), 0, 1), 0.08);

    rafId = requestAnimationFrame(update);
  };
  rafId = requestAnimationFrame(update);

  // 제스처 → 톤/공간감 매핑
  const mapGesture = (x, y) => {
    if (!ac) return;
    const ww = window.innerWidth, hh = window.innerHeight;
    const nx = clamp(x / ww, 0, 1);
    const ny = clamp(y / hh, 0, 1);
    // 오른쪽으로 갈수록 더 맑고 밝게
    const cutoff = 500 + nx * 2400; // 500~2900 Hz
    filter.frequency.linearRampToValueAtTime(cutoff, ac.currentTime + 0.15);
    // 아래로 갈수록 공간감 길게
    const d = 0.18 + ny * 0.6;      // 0.18~0.78 s
    delay.delayTime.linearRampToValueAtTime(d, ac.currentTime + 0.2);
  };

  const onMove = (e) => {
    const p = e.touches ? e.touches[0] : e;
    mapGesture(p.clientX, p.clientY);
  };
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  nodes = { base, harm, lfo, lfoGain, filter, delay, feedback, gain, analyser, rafId, onMove };
}

function stopEngine() {
  if (!nodes) return;
  const { base, harm, lfo, gain, rafId, onMove } = nodes;
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.2);
  cancelAnimationFrame(rafId);
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('touchmove', onMove);

  setTimeout(() => {
    try { base.stop(); harm.stop(); lfo.stop(); ac.close(); } catch {}
    nodes = null; isPlaying = false;
    window.__cosmicEnergy = 0.0;
    window.__cosmicTone   = 0.5;
  }, 1300);
}

// 유틸
function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }
function smooth(prev, next, amt){ return prev + (next - prev) * amt; }
function avg(arr, s, e){ let sum=0, n=0; for(let i=s;i<e;i++){ sum+=arr[i]; n++; } return n?sum/n:0; }

// 버튼 핸들러
btnPlay?.addEventListener('click', () => {
  if (isPlaying) return;
  if (!ac || ac.state === 'closed') createEngine();
  isPlaying = true;
  btnPlay.disabled = true;
  btnStop.disabled = false;
});

btnStop?.addEventListener('click', () => {
  stopEngine();
  btnPlay.disabled = false;
  btnStop.disabled = true;
});
