import { Howl } from 'howler';

// Sound URLs - you'll need to add actual sound files to your public folder
const SOUNDS = {
  message: '/sounds/message.mp3',
  notification: '/sounds/notification.mp3',
  join: '/sounds/join.mp3',
  leave: '/sounds/leave.mp3',
  terminate: '/sounds/terminate.mp3'
};

class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  private enabled: boolean = true;
  private fallbackEnabled: boolean = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const sound = new Howl({
        src: [url],
        html5: true,
        preload: false,
        onloaderror: () => {
          this.fallbackEnabled = true;
        }
      });
      this.sounds.set(key, sound);
    });
  }

  private playFallbackBeep(type: string) {
    if (!this.fallbackEnabled || !this.enabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch(type) {
        case 'message':
          oscillator.frequency.value = 880; // A5
          gainNode.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
        case 'notification':
          oscillator.frequency.value = 660; // E5
          gainNode.gain.value = 0.15;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.15);
          break;
        case 'join':
          oscillator.frequency.value = 523.25; // C5
          gainNode.gain.value = 0.2;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case 'leave':
          oscillator.frequency.value = 392; // G4
          gainNode.gain.value = 0.15;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'terminate':
          oscillator.frequency.value = 220; // A3
          gainNode.gain.value = 0.2;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        default:
          break;
      }
    } catch {
      // Ignore audio context errors
    }
  }

  play(type: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(type);
    if (sound && sound.state() === 'loaded') {
      sound.play();
    } else {
      this.playFallbackBeep(type);
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
