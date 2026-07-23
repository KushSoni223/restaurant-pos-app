import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = '@restaurant_pos_token';

let accessToken: string | null = null;

export const authToken = {
  get: () => accessToken,

  async getAsync(): Promise<string | null> {
    if (accessToken) {
      return accessToken;
    }
    accessToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    return accessToken;
  },

  set: (token: string | null) => {
    accessToken = token;
  },
};
