let loaded = false;

let meowHappy: HTMLAudioElement;
let meowAngry: HTMLAudioElement;
let backgroundMusic: HTMLAudioElement;
let clickSound: HTMLAudioElement;

function ensureLoaded() {
  if (loaded) return;
  meowHappy = new Audio("/assets/meowHappy.wav");
  meowAngry = new Audio("/assets/meowAngry.wav");
  backgroundMusic = new Audio("/assets/backgroundMusic.wav");
  clickSound = new Audio("/assets/click.wav");
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.35;
  loaded = true;
}

function safePlay(audio: HTMLAudioElement) {
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

export function playClick(soundsOn: boolean) {
  if (!soundsOn) return;
  ensureLoaded();
  safePlay(clickSound);
}

export function playMeowHappy(soundsOn: boolean) {
  if (!soundsOn) return;
  ensureLoaded();
  safePlay(meowHappy);
}

export function playMeowAngry(soundsOn: boolean) {
  if (!soundsOn) return;
  ensureLoaded();
  safePlay(meowAngry);
}

export function startBackgroundMusic(shouldPlay: boolean) {
  ensureLoaded();
  if (!shouldPlay) return;
  void backgroundMusic.play().catch(() => undefined);
}

export function stopBackgroundMusic() {
  ensureLoaded();
  backgroundMusic.pause();
}
