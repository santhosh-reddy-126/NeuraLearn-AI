import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const LineChartComponent = ({ data, xKey = "date", yKey = "score", title = "Progress Over Time", color = "#3F8EFC" }) => (
  <div style={{ width: "100%", height: 320, background: "#fff", borderRadius: "1rem", boxShadow: "0 2px 12px #3F8EFC11", padding: "1.5rem" }}>
    <h4 style={{ color: "#3F8EFC", marginBottom: "1rem" }}>{title}</h4>
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontWeight: 600 }} />
        <YAxis tick={{ fontWeight: 600 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={3} dot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default LineChartComponent;