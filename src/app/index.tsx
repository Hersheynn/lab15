import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";

const API_URL = "http://172.17.203.70:3000";

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State สำหรับการค้นหาและ Yahoo Finance
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // State สำหรับพอร์ต, Watchlist และแท็บที่เลือกแสดงผล ('portfolio' หรือ 'watchlist')
  const [activeTab, setActiveTab] = useState<"portfolio" | "watchlist">(
    "portfolio",
  );
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  // State สำหรับ Modal เพิ่มหุ้น
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [sharesInput, setSharesInput] = useState("");
  const [buyPriceInput, setBuyPriceInput] = useState("");

  const loadUserDataAndData = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        router.replace("/login" as any);
        return;
      }
      const parsedUser = JSON.parse(userString);
      setUser(parsedUser);

      // ดึงข้อมูลพอร์ตและ Watchlist จาก Backend (XAMPP)
      await fetchPortfolio(parsedUser.id);
      await fetchWatchlist(parsedUser.id);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserDataAndData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserDataAndData();
  };

  // ดึงข้อมูลพอร์ตหุ้น
  const fetchPortfolio = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/portfolio/${userId}`);
      const result = await response.json();
      if (result.success) {
        setPortfolio(result.data);
      }
    } catch (error) {
      console.log("Error fetching portfolio:", error);
    }
  };

  // ดึงข้อมูล Watchlist
  const fetchWatchlist = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/watchlist/${userId}`);
      const result = await response.json();
      if (result.success) {
        setWatchlist(result.data);
      }
    } catch (error) {
      console.log("Error fetching watchlist:", error);
    }
  };

  // ค้นหาหุ้นผ่าน Yahoo Finance API
  const handleSearchStock = async (queryToSearch?: string) => {
    const keyword = queryToSearch !== undefined ? queryToSearch : searchQuery;
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
          keyword,
        )}`,
      );
      const data = await res.json();
      if (data && data.quotes) {
        setSearchResults(data.quotes.slice(0, 5));
      }
    } catch (error) {
      console.log("Yahoo Finance Search Error:", error);
    } finally {
      setSearching(false);
    }
  };

  // บันทึกประวัติการค้นหาลง XAMPP (`search_history`)
  const saveSearchHistory = async (symbol: string) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/search-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, symbol }),
      });
    } catch (e) {
      console.log("Error saving search history:", e);
    }
  };

  // เพิ่มหุ้นลงพอร์ต
  const handleAddPortfolio = async () => {
    if (!sharesInput || !buyPriceInput || !selectedStock) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกจำนวนหุ้นและราคาซื้อให้ครบถ้วน");
      return;
    }

    const shares = parseFloat(sharesInput);
    const buyPrice = parseFloat(buyPriceInput);

    if (isNaN(shares) || shares <= 0 || isNaN(buyPrice) || buyPrice <= 0) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกตัวเลขจำนวนหุ้นและราคาซื้อให้ถูกต้อง");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          symbol: selectedStock.symbol,
          name:
            selectedStock.shortname ||
            selectedStock.longname ||
            selectedStock.symbol,
          shares: shares,
          buy_price: buyPrice,
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert("สำเร็จ", "เพิ่มหุ้นเข้าพอร์ตเรียบร้อยแล้ว");
        setModalVisible(false);
        setSharesInput("");
        setBuyPriceInput("");
        fetchPortfolio(user.id);
      } else {
        Alert.alert("ผิดพลาด", result.message);
      }
    } catch (error) {
      Alert.alert("เชื่อมต่อล้มเหลว", "ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  // เพิ่มหุ้นลง Watchlist
  const handleAddToWatchlist = async (stock: any) => {
    try {
      const response = await fetch(`${API_URL}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          symbol: stock.symbol,
          name: stock.shortname || stock.longname || stock.symbol,
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert("สำเร็จ", `เพิ่ม ${stock.symbol} ลงใน Watchlist แล้ว`);
        fetchWatchlist(user.id);
      } else {
        Alert.alert("แจ้งเตือน", result.message);
      }
    } catch (error) {
      Alert.alert("เชื่อมต่อล้มเหลว", "ไม่สามารถบันทึก Watchlist ได้");
    }
  };

  // ฟังก์ชัน Logout
  const handleLogout = async () => {
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: async () => {
          try {
            if (user) {
              fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id }),
              }).catch(() => {});
            }
            await AsyncStorage.removeItem("user");
            router.replace("/login" as any);
          } catch (e) {
            console.log("Logout error:", e);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary || "#007AFF"} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.greeting} numberOfLines={1}>
            สวัสดี, {user?.email || "นักลงทุน"}
          </Text>
          <Text style={styles.subGreeting}>H Finance - ระบบจัดการการลงทุน</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>

      {/* Card แสดงยอดพอร์ตหุ้นรวม */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>มูลค่าพอร์ตหุ้นทั้งหมดในระบบ</Text>
        <Text style={styles.balanceAmount}>
          ฿{" "}
          {portfolio
            .reduce((sum, item) => sum + item.shares * item.buy_price, 0)
            .toLocaleString()}
        </Text>
        <Text style={styles.subInfo}>
          จำนวนหุ้นในพอร์ต: {portfolio.length} รายการ | Watchlist:{" "}
          {watchlist.length} รายการ
        </Text>
      </View>

      {/* ช่องค้นหาหุ้น */}
      <View style={styles.searchContainer}>
        <Text style={styles.labelTitle}>🔍 ค้นหาหุ้น (Yahoo Finance)</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="พิมพ์ชื่อย่อหุ้น (เช่น AAPL, PTT.BK)..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearchStock()}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleSearchStock()}
          >
            <Text style={styles.searchButtonText}>ค้นหา</Text>
          </TouchableOpacity>
        </View>

        {searching && <ActivityIndicator style={{ marginTop: 8 }} />}

        {searchResults.length > 0 && (
          <View style={styles.searchResultsBox}>
            {searchResults.map((item) => (
              <View key={item.symbol} style={styles.searchResultItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultSymbol}>{item.symbol}</Text>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.shortname || item.longname}
                  </Text>
                </View>
                <View style={styles.resultActionButtons}>
                  <TouchableOpacity
                    style={styles.actionAddPortBtn}
                    onPress={() => {
                      saveSearchHistory(item.symbol);
                      setSelectedStock(item);
                      setSearchQuery("");
                      setSearchResults([]);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.actionBtnText}>+ พอร์ต</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionAddWatchBtn}
                    onPress={() => {
                      saveSearchHistory(item.symbol);
                      handleAddToWatchlist(item);
                    }}
                  >
                    <Text style={styles.actionBtnText}>+ Watchlist</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* แท็บสลับหน้า ระหว่าง Portfolio และ Watchlist */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "portfolio" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("portfolio")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "portfolio" && styles.activeTabText,
            ]}
          >
            💼 พอร์ตของฉัน ({portfolio.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "watchlist" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("watchlist")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "watchlist" && styles.activeTabText,
            ]}
          >
            ⭐ Watchlist ({watchlist.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* เนื้อหาในแท็บที่เลือก */}
      <View style={styles.sectionContainer}>
        {activeTab === "portfolio" ? (
          <View>
            <Text style={styles.sectionTitle}>
              📈 รายการหุ้นในพอร์ต (Portfolio)
            </Text>
            {portfolio.length > 0 ? (
              portfolio.map((item) => (
                <View key={item.id || item.symbol} style={styles.watchItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                    <Text style={styles.nameText} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.rightInfo}>
                    <Text style={styles.priceText}>
                      ซื้อ: ฿ {item.buy_price}
                    </Text>
                    <Text style={styles.sharesText}>
                      จำนวน: {item.shares} หุ้น
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noResultText}>
                ยังไม่มีหุ้นในพอร์ต ค้นหาหุ้นด้านบนเพื่อเพิ่มเข้าพอร์ต
              </Text>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>⭐ หุ้นที่สนใจ (Watchlist)</Text>
            {watchlist.length > 0 ? (
              watchlist.map((item) => (
                <View key={item.id || item.symbol} style={styles.watchItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.symbolText, { color: "#D97706" }]}>
                      {item.symbol}
                    </Text>
                    <Text style={styles.nameText} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.moveToPortBtn}
                    onPress={() => {
                      setSelectedStock({
                        symbol: item.symbol,
                        shortname: item.name,
                      });
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.moveToPortText}>+ เข้าพอร์ต</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noResultText}>
                ยังไม่มีหุ้นใน Watchlist ของคุณ
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Modal สำหรับกรอกจำนวนหุ้นและราคาซื้อ */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เพิ่มหุ้นเข้าพอร์ต</Text>
            {selectedStock && (
              <Text style={styles.modalSubtitle}>
                {selectedStock.symbol} -{" "}
                {selectedStock.shortname || selectedStock.longname}
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="จำนวนหุ้น (Shares)"
              placeholderTextColor="#888"
              returnKeyType="done" // เปลี่ยนจาก keyboardAction="done" เป็นอันนี้ครับ
              keyboardType="numeric"
              value={sharesInput}
              onChangeText={setSharesInput}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="ราคาที่ซื้อ (Buy Price)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={buyPriceInput}
              onChangeText={setBuyPriceInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#CBD5E1" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#2563EB" }]}
                onPress={handleAddPortfolio}
              >
                <Text style={[styles.btnText, { color: "#FFF" }]}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  greeting: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  subGreeting: { fontSize: 13, color: "#64748B", marginTop: 2 },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
  },
  logoutText: { color: "#EF4444", fontSize: 12, fontWeight: "600" },
  balanceCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  balanceTitle: { color: "#94A3B8", fontSize: 13, marginBottom: 8 },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subInfo: { color: "#94A3B8", fontSize: 12 },
  searchContainer: { marginBottom: 20, zIndex: 10 },
  labelTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
  },
  searchButton: {
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  searchButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  searchResultsBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  resultSymbol: { fontSize: 15, fontWeight: "bold", color: "#1E293B" },
  resultName: { fontSize: 12, color: "#64748B", maxWidth: 150 },
  resultActionButtons: { flexDirection: "row", gap: 6 },
  actionAddPortBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionAddWatchBtn: {
    backgroundColor: "#D97706",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionBtnText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#2563EB", fontWeight: "bold" },
  sectionContainer: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  watchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  symbolText: { fontSize: 16, fontWeight: "bold", color: "#2563EB" },
  nameText: { fontSize: 12, color: "#64748B", maxWidth: 160, marginTop: 2 },
  rightInfo: { alignItems: "flex-end" },
  priceText: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  sharesText: { fontSize: 12, color: "#64748B", marginTop: 2 },
  moveToPortBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  moveToPortText: { color: "#2563EB", fontSize: 12, fontWeight: "bold" },
  noResultText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 20,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 13, color: "#64748B", marginBottom: 16 },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    color: "#1E293B",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnText: { fontSize: 14, fontWeight: "600", color: "#334155" },
});
