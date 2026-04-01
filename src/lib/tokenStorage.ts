const ACCESS_KEY = 'whatsup_access_token';
const REFRESH_KEY = 'whatsup_refresh_token';

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),

  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },

  setAccess: (access: string): void => {
    localStorage.setItem(ACCESS_KEY, access);
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
