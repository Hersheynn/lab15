import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/theme";
import { formatNumber, formatPercent } from "../utils/format";

interface Props {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  onPress: () => void;
}

export default function StockCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  onPress,
}: Props) {
  const isUp = change >= 0;
  const color = isUp ? COLORS.up : COLORS.down;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.price}>{formatNumber(price)}</Text>
        <Text style={[styles.change, { color }]}>
          {isUp ? "▲" : "▼"} {formatNumber(Math.abs(change))} (
          {formatPercent(changePercent)})
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  symbol: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  name: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  change: { fontSize: 13, fontWeight: "600", marginTop: 2 },
});
