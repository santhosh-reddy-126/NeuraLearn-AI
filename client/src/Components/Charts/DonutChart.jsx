// DonutChart.js
import { PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3EE4B2", "#3F8EFC"]; // Green for completed, vivid blue for remaining

const DonutChart = ({ completed, total,title,ct,rt }) => {
  const data = [
    { name: ct, value: completed },
    { name: rt, value: Math.max(0, total - completed) },
  ];

  return (
    <div
      style={{
        width: "100%",
        minWidth: 260,
        maxWidth: 320,
        textAlign: "center",
        fontFamily: "Segoe UI, sans-serif"
      }}
    >
      <h2
        style={{
          fontSize: "1.35rem",
          fontWeight: 700,
          color: "#3F8EFC",
          marginBottom: "1rem",
          letterSpacing: "0.01em"
        }}
      >
        {title}
      </h2>
      <PieChart width={260} height={220}>
        <Pie
          data={data}
          innerRadius={60}
          outerRadius={90}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Legend
          wrapperStyle={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#1a237e",
            fontFamily: "Segoe UI, sans-serif"
          }}
        />
      </PieChart>
      <p
        style={{
          marginTop: "1rem",
          fontSize: "1.15rem",
          fontWeight: 700,
          color: "#3EE4B2"
        }}
      >
        {total > 0 ? ((completed / total) * 100).toFixed(1) : 0}% {ct}
      </p>
    </div>
  );
};

export default DonutChart;
