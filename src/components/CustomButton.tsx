import { Pressable, StyleSheet, Text } from "react-native";
import { COLORS } from "../constants/theme";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
}

export default function CustomButton({
  title,
  onPress,
  variant = "primary",
  disabled,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "outline" ? styles.outline : styles.primary,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "outline" && { color: COLORS.primary },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  primary: { backgroundColor: COLORS.primary },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  text: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
