"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export function Sparkline({
  data,
  dataKey = "value",
}: {
  data: { value: number }[];
  dataKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#146c53"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
