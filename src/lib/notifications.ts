class NotificationService {
  private permission: NotificationPermission = 'default';
  private soundEnabled = true;
  private audio: HTMLAudioElement | null = null;

  constructor() {
    if ('Notification' in window) this.permission = Notification.permission;
    this.audio = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdA==',
    );
    if (this.audio) this.audio.volume = 0.4;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (this.permission === 'granted') return 'granted';
    this.permission = await Notification.requestPermission();
    return this.permission;
  }

  getPermission(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied';
  }

  async showNotification(
    title: string,
    options?: { body?: string; icon?: string; tag?: string; onClick?: () => void },
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
        n.onclick = () => { window.focus(); options.onClick?.(); n.close(); };
      }
      setTimeout(() => n.close(), 5000);
    } catch {}
  }

  playSound(): void {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    }
  }

  setSoundEnabled(enabled: boolean): void { this.soundEnabled = enabled; }
  isSoundEnabled(): boolean { return this.soundEnabled; }
}

export const notificationService = new NotificationService();
