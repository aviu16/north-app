import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'north_';

export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(PREFIX + key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.error(`Storage set error [${key}]:`, error);
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(PREFIX + key);
    } catch (error) {
      console.error(`Storage remove error [${key}]:`, error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const northKeys = keys.filter((k) => k.startsWith(PREFIX));
      await AsyncStorage.multiRemove(northKeys);
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
};
