// BUG FIX 14: Entire class wrapped defensively so Audio() constructor failure
// (SSR, restricted environments, missing AudioContext) doesn't crash the module.

class NotificationService {
  private permission: NotificationPermission = 'default';
  private soundEnabled = true;
  private audio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    // BUG FIX 14: Wrap Audio construction in try/catch.
    // new Audio() can throw in test environments, headless browsers, or when
    // the media APIs are unavailable. A failed audio init should not prevent
    // notifications from working entirely.
    try {
      this.audio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdA==',
      );
      this.audio.volume = 0.4;
    } catch {
      this.audio = null;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window))
      return 'denied';
    if (this.permission === 'granted') return 'granted';
    this.permission = await Notification.requestPermission();
    return this.permission;
  }

  getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window))
      return 'denied';
    return Notification.permission;
  }

  async showNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      tag?: string;
      onClick?: () => void;
    },
  ): Promise<void> {
    if (this.soundEnabled) this.playSound();
    if (this.permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body: options?.body,
        icon: options?.icon ?? '/favicon.ico',
        tag: options?.tag,
        silent: true,
      });
      if (options?.onClick) {
        n.onclick = () => {
          window.focus();
          options.onClick?.();
          n.close();
        };
      }
      setTimeout(() => n.close(), 5000);
    } catch {
      // Notification API unavailable or permission revoked mid-session
    }
  }

  playSound(): void {
    if (!this.audio) return;
    try {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    } catch {
      // Audio playback failed (e.g. autoplay policy)
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }
}

export const notificationService = new NotificationService();
