
export const loadState = <T,>(key: string, fallback: T): T => {
  const saved = localStorage.getItem(key);
  try {
      return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
      console.error(`Error parsing ${key} from localStorage`, e);
      return fallback;
  }
};

export const saveState = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
};
