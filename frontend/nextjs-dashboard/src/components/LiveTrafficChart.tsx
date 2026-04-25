"use client";
import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);
export default function LiveTrafficChart({
  data,
}: {
  data: { timestamp: string; risk_score: number }[];
}) {
  const chartData = useMemo(() => {
    const recentData = data.slice(-20);
    return {
      labels: recentData.map((d) => d.timestamp),
      datasets: [
        {
          fill: true,
          label: "Risk Score Pulse",
          data: recentData.map((d) => d.risk_score),
          borderColor: "rgb(139, 92, 246)",
          /* violet-500 */ backgroundColor: "rgba(139, 92, 246, 0.1)",
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: "rgb(139, 92, 246)",
          borderWidth: 2,
        },
      ],
    };
  }, [data]);
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: { color: "#6b7280", font: { size: 10 } },
        grid: { color: "#e5e7eb" },
      },
      x: {
        ticks: {
          color: "#6b7280",
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: { display: false },
      },
    },
    animation: { duration: 0 },
  };
  return (
    <div className="h-full w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
