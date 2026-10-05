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

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      // ใช้ API_URL อัตโนมัติ และตัด /api ออกให้ตรงกับ server.js
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("สำเร็จ", "สมัครสมาชิกเรียบร้อยแล้ว", [
          { text: "ไปหน้าเข้าสู่ระบบ", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("ผิดพลาด", data.message || "ไม่สามารถสมัครสมาชิกได้");
      }
    } catch (e) {
      console.log("Register error:", e);
      Alert.alert(
        "เชื่อมต่อล้มเหลว",
        `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (${API_URL})`,
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 สมัครสมาชิก</Text>

      <TextInput
        style={styles.input}
        placeholder="ชื่อผู้ใช้ (Username)"
        placeholderTextColor={COLORS.textSecondary}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="อีเมล"
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

      <CustomButton title="ยืนยันการสมัคร" onPress={handleRegister} />

      <CustomButton
        title="กลับไปหน้าเข้าสู่ระบบ"
        variant="outline"
        onPress={() => router.back()}
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
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 24,
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
