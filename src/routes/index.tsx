import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Download, MessageCircle, CheckCircle2, Globe, UserCheck, ArrowRightLeft } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Legend,
} from "recharts";

export const Route = createFileRoute("/")({
  component: Index,
});

const trendData = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (13 - i));
  const total = 800 + Math.round(Math.sin(i / 2) * 200 + Math.random() * 150);
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    总会话数: total,
    有效会话数: Math.round(total * 0.78),
    转人工数: Math.round(total * 0.18),
  };
});

const channelData = trendData.map((d) => ({
  date: d.date,
  桌面网站: Math.round(d.总会话数 * 0.45),
  移动网站: Math.round(d.总会话数 * 0.35),
  Shopify: Math.round(d.总会话数 * 0.2),
}));

function Index() {
  return (
    <div>
      <PageHeader
        title="接待总览"
        description="实时监控 AI 客服接待情况、会话转化与渠道分布"
        actions={
          <Button className="gap-2">
            <Download className="w-4 h-4" /> 导出会话明细
          </Button>
        }
      />
      <FilterBar />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="总会话数" value="12,486" delta={12.4} icon={MessageCircle} accent="primary" />
        <StatCard label="有效会话数" value="9,732" delta={8.1} icon={CheckCircle2} accent="success" />
        <StatCard label="独立站接待会话" value="4,218" delta={-2.3} icon={Globe} accent="info" />
        <StatCard label="有效会话转人工" value="1,564" delta={4.6} icon={UserCheck} accent="warning" />
        <StatCard label="直接转人工" value="426" delta={-1.8} icon={ArrowRightLeft} accent="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">会话趋势</h3>
              <p className="text-xs text-muted-foreground mt-0.5">近 14 天会话量变化</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="总会话数" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="有效会话数" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="转人工数" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">渠道分布趋势</h3>
              <p className="text-xs text-muted-foreground mt-0.5">不同渠道会话堆叠</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={channelData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6}/><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0}/></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.6}/><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0}/></linearGradient>
                <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.6}/><stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <Area type="monotone" dataKey="桌面网站" stackId="1" stroke="var(--chart-1)" fill="url(#g1)" />
              <Area type="monotone" dataKey="移动网站" stackId="1" stroke="var(--chart-2)" fill="url(#g2)" />
              <Area type="monotone" dataKey="Shopify" stackId="1" stroke="var(--chart-4)" fill="url(#g3)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
