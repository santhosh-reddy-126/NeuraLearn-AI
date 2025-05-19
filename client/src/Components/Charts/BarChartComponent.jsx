// BarChartComponent.js
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

const BarChartComponent = ({ data,title,col,row,rowname }) => {
  return (
    <div
      style={{
        width: "100%",
        minWidth: 320,
        maxWidth: 500,
        background: "#fff",
        borderRadius: "1.2rem",
        boxShadow: "0 4px 24px #3F8EFC11",
        padding: "2rem 1rem",
        margin: "0 auto",
        textAlign: "center",
        fontFamily: "Segoe UI, sans-serif"
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "#3F8EFC",
          marginBottom: "1.2rem",
          letterSpacing: "0.01em"
        }}
      >
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3eafc" />
          <XAxis 
            dataKey={col}
            tick={{ fill: "#1a237e", fontWeight: 600, fontSize: 13 }} 
            axisLine={{ stroke: "#3F8EFC" }} 
          />
          <YAxis 
            allowDecimals={false} 
            tick={{ fill: "#1a237e", fontWeight: 600, fontSize: 13 }} 
            axisLine={{ stroke: "#3F8EFC" }}
          />
          <Tooltip 
            contentStyle={{ fontWeight: 600, fontFamily: "Segoe UI, sans-serif", borderRadius: 8 }}
            labelStyle={{ color: "#3F8EFC", fontWeight: 700 }}
            cursor={{ fill: "#3F8EFC11" }}
          />
          <Legend 
            wrapperStyle={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#3F8EFC",
              fontFamily: "Segoe UI, sans-serif"
            }}
          />
          <Bar 
            dataKey={row}
            name={rowname} 
            fill="#3EE4B2" 
            radius={[8, 8, 0, 0]} 
            barSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;
