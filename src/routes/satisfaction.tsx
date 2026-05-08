import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { MessageCircle, CheckCircle2, ClipboardList, Percent, ThumbsUp, ThumbsDown, Smile, BadgeCheck } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/satisfaction")({ component: Page });

const pieData = [
  { name: "已解决", value: 6420, color: "var(--chart-5)" },
  { name: "未解决", value: 980, color: "var(--chart-3)" },
];

function Page() {
  return (
    <div>
      <PageHeader title="满意度评价统计" description="服务质量与用户满意度分析" />
      <FilterBar />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="总会话数" value="12,486" icon={MessageCircle} accent="primary" />
        <StatCard label="有效会话数" value="9,732" icon={CheckCircle2} accent="success" />
        <StatCard label="参评会话数" value="7,400" icon={ClipboardList} accent="info" />
        <StatCard label="参评率" value="76.0%" icon={Percent} accent="warning" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="已解决数" value="6,420" delta={6.2} icon={BadgeCheck} accent="success" />
        <StatCard label="未解决数" value="980" delta={-2.1} icon={ThumbsDown} accent="warning" />
        <StatCard label="点击满意会话数" value="6,180" delta={4.5} icon={ThumbsUp} accent="primary" />
        <StatCard label="满意率" value="83.5%" delta={1.8} icon={Smile} accent="success" />
      </div>
      <div className="bg-card rounded-lg border p-5 shadow-[var(--shadow-card)] max-w-xl">
        <h3 className="font-semibold mb-3">解决率分布</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
              {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}