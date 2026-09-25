/**
 * Tactical Security Audio Alert Synthesizer & MP3 Player.
 * Pre-decodes /audio/error.mp3 with Web Audio API for zero-latency playback.
 * Automatically unlocks on first user gesture (click/keypress) anywhere on the page.
 */

class AudioAlertService {
  constructor() {
    this.isMuted = false;
    this.isPlaying = false;
    this.lastPlayTime = 0;
    this.audioBuffer = null;
    this.audioCtx = null;
    this.unlocked = false;
    this.cooldownMs = 2000; // Minimum interval between repeats

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
    }

    // Auto-unlock on first user interaction anywhere on the document
    const unlockHandler = () => {
      this.unlock();
      ['click', 'keydown', 'touchstart', 'mousedown'].forEach(evt => {
        window.removeEventListener(evt, unlockHandler);
      });
    };

    ['click', 'keydown', 'touchstart', 'mousedown'].forEach(evt => {
      window.addEventListener(evt, unlockHandler, { once: true, passive: true });
    });

    // Pre-fetch and decode /audio/error.mp3 into memory
    this.loadAudioBuffer();
  }

  unlock() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().then(() => {
        this.unlocked = true;
      }).catch(() => {});
    } else {
      this.unlocked = true;
    }
  }

  async loadAudioBuffer() {
    try {
      const res = await fetch('/audio/error.mp3');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();

      if (this.audioCtx) {
        this.audioCtx.decodeAudioData(
          arrayBuf,
          (decoded) => {
            this.audioBuffer = decoded;
            console.log('✅ error.mp3 decoded and ready in Web Audio API memory');
          },
          (err) => {
            console.warn('Web Audio decode error, will use fallback:', err);
          }
        );
      }
    } catch (err) {
      console.warn('Failed to pre-cache /audio/error.mp3:', err.message);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Plays jaldi.mp3 upon restricted zone breach.
   * Uses decoded Web Audio API buffer first, with HTML5 Audio as secondary fallback.
   */
  playRestrictedBreachBeep() {
    if (this.isMuted) return;

    const now = Date.now();
    if (this.isPlaying && (now - this.lastPlayTime < this.cooldownMs)) {
      return;
    }

    this.unlock();

    // 1. Primary: Web Audio API BufferSource (zero stutter, immediate play)
    if (this.audioCtx && this.audioBuffer) {
      try {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const source = this.audioCtx.createBufferSource();
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = 1.0; // Full clear volume

        source.buffer = this.audioBuffer;
        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        this.isPlaying = true;
        this.lastPlayTime = now;

        source.onended = () => {
          this.isPlaying = false;
        };

        source.start(0);
        return;
      } catch (err) {
        console.warn('Web Audio buffer playback error, falling back:', err.message);
      }
    }

    // 2. Secondary: Standard HTML5 Audio Element fallback
    try {
      const audio = new Audio('/audio/error.mp3');
      this.isPlaying = true;
      this.lastPlayTime = now;

      audio.onended = () => {
        this.isPlaying = false;
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          this.isPlaying = false;
          console.warn('HTML5 Audio play rejected:', err.message);
        });
      }
    } catch (err) {
      this.isPlaying = false;
    }
  }

  /**
   * Immediate test method callable by clicking the UI test button.
   */
  testPlay() {
    this.unlock();
    this.isPlaying = false; // Reset lock for instant test
    this.lastPlayTime = 0;
    this.playRestrictedBreachBeep();
  }
}

const audioAlert = new AudioAlertService();
export default audioAlert;
