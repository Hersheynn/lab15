import Constants from "expo-constants";

// ดึง Host อัตโนมัติจาก Expo Development Server
const debuggerHost =
  Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localhost = debuggerHost ? debuggerHost.split(":")[0] : "localhost";

// กำหนด API_URL กลางของโปรเจกต์
export const API_URL = `http://${localhost}:3000`;
