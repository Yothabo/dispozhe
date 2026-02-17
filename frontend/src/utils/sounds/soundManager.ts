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
    // Initialize sounds (they'll load on first play)
    this.loadSounds();
  }

  private loadSounds() {
    // Try to load actual sound files
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const sound = new Howl({
        src: [url],
        html5: true,
        preload: false,
        onloaderror: () => {
          console.log(`[Sound] Failed to load ${key}, using fallback`);
          this.fallbackEnabled = true;
        }
      });
      this.sounds.set(key, sound);
    });
  }

  // Fallback using Web Audio API for simple beeps
  private playFallbackBeep(type: string) {
    if (!this.fallbackEnabled || !this.enabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different tones for different events
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
      }
    } catch (e) {
      console.log('[Sound] Web Audio API not supported');
    }
  }

  play(type: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(type);
    if (sound && sound.state() === 'loaded') {
      sound.play();
    } else {
      // Use fallback beep
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
