// Notification service for push notifications and sound alerts

class NotificationService {
  private permission: NotificationPermission = 'default';
  private audio: HTMLAudioElement | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    this.init();
  }

  private init() {
    // Check current permission
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }

    // Create audio element for notification sound
    this.audio = new Audio();
    // Use a data URI for a simple notification sound
    this.audio.src =
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVYdBq6wqIGIjJeLf19bclqOsL2viF85NVaUxNy+gDECBz+Jt9HHnnFGGCV5nsS3o3xlOio+abC4ooByWDclBDhofpGdnYF1alM9Jy0eKzNCXnqQnpmFd2NQMRUHCBYoRWaJopuFd2JYPiQUBwoVJEFefJqhmIBqWDwkEgUOHDVXcYyjpJB9a1xDLRkOEyQ4UGqDl56XhXVjSjUeBQgPHTJNZn+SnpqKfG1bQy0dDxQhOFJqgpaenYx7aVQ9JhYJDhslQl2AmaKbjHpnUTcgDwgPHDFPaIecpZuKdmdLNBoLBw0bK0Reh5+moI17aFI5IRMHCQ4ZKENbfpien458cFlBKRgLCQ8bLE1jhZ+nmYl3Zks1Gg8JDhkpP1d7lqKejnxuWkMpGQ4KEBA2TGSEnaWZinlpUTshEQgLFChDW36XoZ2OfG5bRSoYDQoQEClHXX6XoZyMfG5cRiskEQkLFCc+VnqWop6OgHFfRy0cDwkOFCs/VnmVop6OgHFgSC4dDwkPFCs/V3mVoZ6OgHFgSC8dDgoQFSs+VnmVoZ6OgHJgSC8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs/VnmVoZ6OgHJgSS8dDwkQFCs/VnmVoZ6OgHFgSS8dDwkQFCs/VnmVoZ6OgHFgSS8dDwoQFCs/VnmVoZ6OgHFgSC8dDwoQFCs/VnmVoZ6OgHFgSC8dDwoQFSs/VnmVoZ6OgHFgSC8dDwoQFSs+VnmVoZ6OgHJgSC8dDwoQFSs+VnmVoZ6OgHJgSC8dDwoQFSs+VnmVoZ6OgHJgSC8dDwoQFSs+VnmVoZ6OgHJgSC8dDwoQFSs+VnmVoZ6OgHJhSC4eDwoQFSw+VnqVoZ6OgHFhRy4eDwoQFSw+VnqVoZ2PgHFhRy0eDwoQFSw+VnqVoZ2PgXFhRy0eDwoQFSw+VnqVoZ2PgXFgRy0eDwoQFSw+VnqVoZ2PgXFgRy0eDwoQFSw+VnqVoZ2PgXFgRy0eDwoQFSw+VnqVoZ2PgXFgRy0dDwoQFSw+VnqVoZ2PgXFgRy4eDwoQFSw+VnqVoZ2PgXFgRy4eDwoQFSw+VnqVoZ2PgHFhRy4eDwoQFSw+VnqVoZ2OgHFhSC8eDwoQFSw+VnqVoZ2OgHFhSC8eDwoQFCw+VnqVoZ2OgHFhSC8dDgoQFCw+VnmVoZ6OgHFhSS8dDgoQFCs+VnmVoZ6OgHJhSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8dDgoQFCs+VnmVoZ6OgHJgSS8d';
    this.audio.volume = 0.5;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  getPermission(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
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
    // Play sound
    if (this.soundEnabled) {
      this.playSound();
    }

    // Show browser notification if permitted
    if (this.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/favicon.ico',
        tag: options?.tag,
        silent: true, // We play our own sound
      });

      if (options?.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  playSound(): void {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {
        // Ignore autoplay errors
      });
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
