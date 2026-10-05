import { View } from "react-native";
import Svg, { Line, Polyline } from "react-native-svg";
import { COLORS } from "../constants/theme";

interface Props {
  data: number[];
  positive?: boolean;
  width?: number;
  height?: number;
}

export default function SparklineChart({
  data,
  positive = true,
  width = 320,
  height = 140,
}: Props) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data
    .map(
      (v, i) =>
        (i * stepX).toFixed(1) +
        "," +
        (height - 8 - ((v - min) / range) * (height - 16)).toFixed(1),
    )
    .join(" ");
  const color = positive ? COLORS.up : COLORS.down;
  const lastY =
    height - 8 - ((data[data.length - 1] - min) / range) * (height - 16);

  return (
    <View style={{ alignItems: "center" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={"0 0 " + width + " " + height}
        preserveAspectRatio="none"
      >
        <Line
          x1="0"
          y1={height - 8}
          x2={width}
          y2={height - 8}
          stroke={COLORS.border}
          strokeWidth="1"
        />
        <Polyline points={points} fill="none" stroke={color} strokeWidth="2" />
        <Polyline
          points={
            "0," +
            (height - 8) +
            " " +
            points +
            " " +
            width +
            "," +
            (height - 8)
          }
          fill={color}
          opacity="0.08"
          stroke="none"
        />
      </Svg>
    </View>
  );
}
