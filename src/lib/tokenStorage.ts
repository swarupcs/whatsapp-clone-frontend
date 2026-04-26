const ACCESS_KEY = 'whatsup_access_token';

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),

  setAccess: (access: string): void => {
    localStorage.setItem(ACCESS_KEY, access);
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_KEY);
  },
};
