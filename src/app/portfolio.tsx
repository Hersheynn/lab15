import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import EmptyState from "../components/EmptyState";
import LoadingView from "../components/LoadingView";
import { COLORS } from "../constants/theme";
import { fetchQuote } from "../services/stockApi";
import { formatNumber } from "../utils/format";

// ดึง Host อัตโนมัติจาก Expo Development Server (ไม่ต้องเปลี่ยน IP บ่อยๆ)
const debuggerHost =
  Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localhost = debuggerHost ? debuggerHost.split(":")[0] : "localhost";
const API_URL = `http://${localhost}:3000`;

interface HoldingItem {
  id: number;
  user_id: number;
  symbol: string;
  name: string;
  shares: number;
  buy_price: number;
}

interface Row extends HoldingItem {
  currentPrice: number;
  marketValue: number;
  pl: number;
  plPercent: number;
}

export default function PortfolioScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("แจ้งเตือน", "กรุณาเข้าสู่ระบบใหม่", [
          {
            text: "ไปหน้าล็อกอิน",
            onPress: () => router.replace("/login" as any),
          },
        ]);
        return;
      }
      const user = JSON.parse(userData);

      // ดึงข้อมูลพอร์ตจาก Backend MySQL (ตัด /api ออกให้ตรงกับ server.js)
      const res = await fetch(`${API_URL}/portfolio/${user.id}`);
      const json = await res.json();

      if (!json.success || !json.data) {
        setRows([]);
        return;
      }

      const holdings: HoldingItem[] = json.data;

      const enriched = await Promise.all(
        holdings.map(async (h) => {
          try {
            const q = await fetchQuote(h.symbol, h.name);
            const marketValue = q.price * h.shares;
            const cost = h.buy_price * h.shares;
            return {
              ...h,
              currentPrice: q.price,
              marketValue,
              pl: marketValue - cost,
              plPercent: cost ? ((marketValue - cost) / cost) * 100 : 0,
            };
          } catch {
            const cost = h.buy_price * h.shares;
            return {
              ...h,
              currentPrice: h.buy_price,
              marketValue: cost,
              pl: 0,
              plPercent: 0,
            };
          }
        }),
      );
      setRows(enriched);
    } catch (e) {
      console.log("Portfolio load error:", e);
      Alert.alert("ผิดพลาด", `ไม่สามารถโหลดข้อมูลพอร์ตได้ (${API_URL})`);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPortfolio();
    }, []),
  );

  const confirmRemove = (row: Row) => {
    Alert.alert(
      "ยืนยันการลบ",
      "ต้องการลบ " + row.symbol + " ออกจากพอร์ตหรือไม่",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              // ลบข้อมูลพอร์ตใน MySQL ผ่าน API DELETE (ตัด /api ออก)
              const res = await fetch(`${API_URL}/portfolio/${row.id}`, {
                method: "DELETE",
              });
              const json = await res.json();
              if (json.success) {
                loadPortfolio();
              } else {
                Alert.alert("ผิดพลาด", "ไม่สามารถลบรายการได้");
              }
            } catch (e) {
              Alert.alert("ผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
            }
          },
        },
      ],
    );
  };

  if (loading) return <LoadingView message="กำลังคำนวณพอร์ต..." />;

  const totalCost = rows.reduce((s, r) => s + r.buy_price * r.shares, 0);
  const totalValue = rows.reduce((s, r) => s + r.marketValue, 0);
  const totalPl = totalValue - totalCost;
  const totalPlPercent = totalCost ? (totalPl / totalCost) * 100 : 0;
  const plColor = totalPl >= 0 ? COLORS.up : COLORS.down;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>มูลค่าพอร์ตปัจจุบัน</Text>
        <Text style={styles.summaryValue}>${formatNumber(totalValue)}</Text>
        <Text style={[styles.summaryPl, { color: plColor }]}>
          {totalPl >= 0 ? "+" : ""}
          {formatNumber(totalPl)} ({totalPl >= 0 ? "+" : ""}
          {formatNumber(totalPlPercent)}%)
        </Text>
        <Text style={styles.summaryCost}>
          ทุนรวม: ${formatNumber(totalCost)}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            emoji="💼"
            title="ยังไม่มีหุ้นในพอร์ต"
            subtitle="ไปที่หน้ารายละเอียดหุ้นเพื่อบันทึกการถือครอง"
          />
        }
        renderItem={({ item }) => {
          const c = item.pl >= 0 ? COLORS.up : COLORS.down;
          return (
            <View style={styles.card}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.meta}>
                  {item.shares} หุ้น • ซื้อที่ {formatNumber(item.buy_price)}
                </Text>
                <Text style={styles.meta}>
                  ราคาปัจจุบัน {formatNumber(item.currentPrice)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.value}>
                  ${formatNumber(item.marketValue)}
                </Text>
                <Text style={{ color: c, fontWeight: "600" }}>
                  {item.pl >= 0 ? "+" : ""}
                  {formatNumber(item.pl)} ({item.pl >= 0 ? "+" : ""}
                  {formatNumber(item.plPercent)}%)
                </Text>
                <Text style={styles.remove} onPress={() => confirmRemove(item)}>
                  ลบ
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summary: {
    backgroundColor: COLORS.secondary,
    padding: 20,
    alignItems: "center",
  },
  summaryLabel: { color: "#CBD5E1", fontSize: 13 },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryPl: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  summaryCost: { color: "#CBD5E1", fontSize: 13, marginTop: 6 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: "row",
  },
  symbol: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  value: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  remove: { color: COLORS.down, fontSize: 13, marginTop: 6, fontWeight: "600" },
});
