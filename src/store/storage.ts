const createWebStorage = () => {
  return {
    getItem(key: string) {
      return Promise.resolve(window.localStorage.getItem(key));
    },
    setItem(key: string, value: string) {
      window.localStorage.setItem(key, value);
      return Promise.resolve(value);
    },
    removeItem(key: string) {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
};

const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, _value: string) {
      return Promise.resolve();
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== 'undefined' ? createWebStorage() : createNoopStorage();

export default storage;
