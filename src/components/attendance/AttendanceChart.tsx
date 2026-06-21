// src/components/attendance/AttendanceChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { MonthlyStats } from "@/types/attendance";

interface AttendanceChartProps {
  monthlyStats: MonthlyStats[];
}

const COLORS = ["#10b981", "#ef4444", "#6b7280"];

export const AttendanceChart = ({ monthlyStats }: AttendanceChartProps) => {
  const barChartData = monthlyStats.map((stat) => ({
    month: format(parseISO(stat.month + "-01"), "MMM yyyy", { locale: fr }),
    présent: stat.presentSessions,
    absent: stat.absentSessions,
    "non renseigné":
      stat.totalSessions - stat.presentSessions - stat.absentSessions,
    taux: stat.attendanceRate,
  }));

  const pieChartData = [
    {
      name: "Présent",
      value: monthlyStats.reduce((sum, stat) => sum + stat.presentSessions, 0),
    },
    {
      name: "Absent",
      value: monthlyStats.reduce((sum, stat) => sum + stat.absentSessions, 0),
    },
    {
      name: "Non renseigné",
      value: monthlyStats.reduce(
        (sum, stat) =>
          sum +
          (stat.totalSessions - stat.presentSessions - stat.absentSessions),
        0
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="présent" stackId="a" fill="#10b981" />
            <Bar dataKey="absent" stackId="a" fill="#ef4444" />
            <Bar dataKey="non renseigné" stackId="a" fill="#6b7280" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
