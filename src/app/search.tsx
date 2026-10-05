import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { COLORS } from "../constants/theme";
import { SearchResult, searchStocks } from "../services/stockApi";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchStocks(query);
        setResults(data);
        setError(data.length === 0 ? "ไม่พบหุ้นที่ค้นหา" : "");
      } catch (e) {
        setError("ค้นหาไม่สำเร็จ กรุณาลองใหม่");
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="พิมพ์ชื่อหรือสัญลักษณ์หุ้น เช่น AAPL, Apple, PTT"
        placeholderTextColor={COLORS.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {loading && (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
      )}
      {!loading && error !== "" && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => item.symbol}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() =>
              router.push({
                pathname: "/stock/[symbol]",
                params: { symbol: item.symbol, name: item.name },
              })
            }
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <Text style={styles.exchange}>{item.exchange}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    margin: 16,
    color: COLORS.textPrimary,
  },
  error: { color: COLORS.down, textAlign: "center", marginTop: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  row: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  symbol: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  name: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  exchange: { fontSize: 12, color: COLORS.textSecondary },
});
