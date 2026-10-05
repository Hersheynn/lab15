import { Stack } from "expo-router";
import { useEffect } from "react";
import { COLORS } from "../constants/theme";
import { initDatabase } from "../services/dbService";

export default function RootLayout() {
  useEffect(() => {
    try {
      initDatabase();
    } catch (e) {
      console.error("Database init error:", e);
    }
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: "H FINANCE" }} />
      <Stack.Screen name="search" options={{ title: "ค้นหาหุ้น" }} />
      <Stack.Screen
        name="stock/[symbol]"
        options={{ title: "รายละเอียดหุ้น" }}
      />
      <Stack.Screen name="portfolio" options={{ title: "พอร์ตจำลอง" }} />
    </Stack>
  );
}
