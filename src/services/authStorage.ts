import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "@hfinance/logged_in_user";

export async function saveUser(email: string): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, email);
}

export async function getUser(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_KEY);
}

export async function removeUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}
