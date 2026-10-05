import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import CustomButton from "../../components/CustomButton";
import LoadingView from "../../components/LoadingView";
import SparklineChart from "../../components/SparklineChart";
import { COLORS } from "../../constants/theme";
import {
  fetchQuote,
  fetchSparkline,
  StockQuote,
} from "../../services/stockApi";
import { formatNumber, formatPercent } from "../../utils/format";

// ดึง Host อัตโนมัติจาก Expo Development Server (ไม่ต้องเปลี่ยน IP บ่อยๆ)
const debuggerHost =
  Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localhost = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
const API_URL = `http://${localhost}:3000`;

export default function StockDetailScreen() {
  const { symbol, name } = useLocalSearchParams<{
    symbol: string;
    name?: string;
  }>();
  const router = useRouter();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [chart, setChart] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [inWatch, setInWatch] = useState(false);
  const [shares, setShares] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    initUserAndLoad();
  }, [symbol]);

  const initUserAndLoad = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        await load(user.id);
      } else {
        Alert.alert("แจ้งเตือน", "กรุณาเข้าสู่ระบบใหม่", [
          {
            text: "ไปหน้าล็อกอิน",
            onPress: () => router.replace("/login" as any),
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const load = async (currentUserId: number) => {
    setLoading(true);
    try {
      const [q, c, watchRes] = await Promise.all([
        fetchQuote(symbol, name),
        fetchSparkline(symbol),
        fetch(`${API_URL}/watchlist/${currentUserId}`).then((res) =>
          res.json(),
        ),
      ]);
      setQuote(q);
      setChart(c.map((p) => p.close));

      // ตรวจสอบว่าหุ้นตัวนี้อยู่ใน Watchlist ของ User คนนี้หรือยัง
      if (watchRes.success && watchRes.data) {
        const exists = watchRes.data.some(
          (item: any) => item.symbol === symbol,
        );
        setInWatch(exists);
      }
    } catch (e) {
      console.log("Load stock detail error:", e);
      Alert.alert("ผิดพลาด", `โหลดข้อมูลหุ้นไม่สำเร็จ (${API_URL})`);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!quote || !userId) return;
    try {
      if (inWatch) {
        const res = await fetch(`${API_URL}/watchlist/${userId}`);
        const data = await res.json();
        const target = data.data.find((item: any) => item.symbol === symbol);

        if (target) {
          await fetch(`${API_URL}/watchlist/${target.id}`, {
            method: "DELETE",
          });
          setInWatch(false);
          setMessage("ลบออกจาก Watchlist แล้ว");
        }
      } else {
        const response = await fetch(`${API_URL}/watchlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            symbol: quote.symbol,
            name: quote.name,
          }),
        });
        const data = await response.json();
        if (data.success) {
          setInWatch(true);
          setMessage("เพิ่มเข้า Watchlist แล้ว ✅");
        }
      }
    } catch (e) {
      Alert.alert("ผิดพลาด", "ไม่สามารถอัปเดต Watchlist ได้");
    }
  };

  const handleAddHolding = async () => {
    if (!quote || !userId) return;
    const sharesNum = Number(shares);
    const priceNum = Number(buyPrice);
    if (!sharesNum || sharesNum <= 0) {
      setMessage("❌ จำนวนหุ้นต้องมากกว่า 0");
      return;
    }
    if (!priceNum || priceNum <= 0) {
      setMessage("❌ ราคาซื้อต้องมากกว่า 0");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          symbol: quote.symbol,
          name: quote.name,
          shares: sharesNum,
          buy_price: priceNum,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage("✅ บันทึกลงพอร์ตจำลองแล้ว");
        setShares("");
        setBuyPrice("");
      } else {
        setMessage("❌ บันทึกไม่สำเร็จ");
      }
    } catch (e) {
      Alert.alert(
        "ผิดพลาด",
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อบันทึกพอร์ตได้",
      );
    }
  };

  if (loading || !quote)
    return <LoadingView message="กำลังโหลดข้อมูลหุ้น..." />;

  const isUp = quote.change >= 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: quote.symbol }} />
      <Text style={styles.name}>{quote.name}</Text>
      <Text style={styles.price}>
        {formatNumber(quote.price)} {quote.currency}
      </Text>
      <Text style={[styles.change, { color: isUp ? COLORS.up : COLORS.down }]}>
        {isUp ? "▲" : "▼"} {formatNumber(Math.abs(quote.change))} (
        {formatPercent(quote.changePercent)})
      </Text>
      <Text style={styles.prevClose}>
        ราคาปิดก่อนหน้า: {formatNumber(quote.previousClose)}
      </Text>

      <View style={styles.chartBox}>
        <SparklineChart data={chart} positive={isUp} />
      </View>

      <CustomButton
        title={inWatch ? "⭐ ลบออกจาก Watchlist" : "☆ เพิ่มเข้า Watchlist"}
        variant={inWatch ? "outline" : "primary"}
        onPress={toggleWatchlist}
      />

      <View style={styles.form}>
        <Text style={styles.formTitle}>📝 บันทึกพอร์ตจำลอง</Text>
        <TextInput
          style={styles.input}
          placeholder="จำนวนหุ้นที่ถือ เช่น 10"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric"
          value={shares}
          onChangeText={setShares}
        />
        <TextInput
          style={styles.input}
          placeholder="ราคาซื้อต่อหุ้น เช่น 150.50"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="decimal-pad"
          value={buyPrice}
          onChangeText={setBuyPrice}
        />
        <CustomButton title="บันทึกลงพอร์ต" onPress={handleAddHolding} />
      </View>

      {message !== "" && <Text style={styles.message}>{message}</Text>}
      <CustomButton
        title="ไปที่พอร์ตจำลอง 💼"
        variant="outline"
        onPress={() => router.push("/portfolio" as any)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 15, color: COLORS.textSecondary },
  price: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  change: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  prevClose: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6 },
  chartBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 16,
  },
  form: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 8,
    color: COLORS.textPrimary,
  },
  message: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
