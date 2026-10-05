import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import CustomButton from "../components/CustomButton";
import { COLORS } from "../constants/theme";

// ดึง Host อัตโนมัติจาก Expo Development Server (ไม่ต้องคอยเปลี่ยน IP บ่อยๆ)
const debuggerHost =
  Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localhost = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
const API_URL = `http://${localhost}:3000`;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    try {
      // เรียกใช้งานโดยใช้ API_URL อัตโนมัติ และตัด /api ออกให้ตรงกับ server.js ล่าสุด
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.success) {
        // 2. บันทึกข้อมูล user ลงเครื่องก่อนเปลี่ยนหน้า
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        // 3. เปลี่ยนไปหน้า Home สำเร็จ
        router.replace("/" as any);
      } else {
        Alert.alert(
          "ข้อผิดพลาด",
          data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        );
      }
    } catch (e) {
      console.log("Login error:", e);
      Alert.alert(
        "เชื่อมต่อล้มเหลว",
        `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (${API_URL})`,
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📈 H FINANCE</Text>
      <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อติดตามพอร์ตการลงทุน</Text>

      <TextInput
        style={styles.input}
        placeholder="อีเมล (เช่น user@hfinance.com)"
        placeholderTextColor={COLORS.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        placeholderTextColor={COLORS.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <CustomButton title="เข้าสู่ระบบ" onPress={handleLogin} />

      <CustomButton
        title="ยังไม่มีบัญชี? สมัครสมาชิก"
        variant="outline"
        onPress={() => router.push("/register" as any)}
      />

      {/* แสดงบอกสถานะว่ากำลังเชื่อมต่อกับเซิร์ฟเวอร์ไอพีอะไร */}
      <Text style={styles.serverStatus}>Server: {API_URL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    color: COLORS.textPrimary,
  },
  serverStatus: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 20,
  },
});
