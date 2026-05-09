import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  CheckCircle2,
  Database,
  Download,
  FileCheck2,
  MessageCircle,
  Ticket,
  UserCheck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useKnowledgeLibraries, useKnowledgeStore } from "@/lib/knowledge-store";

export const Route = createFileRoute("/")({
  component: Index,
});

const trendData = [
  { date: "4/26", 总会话数: 842, 有效会话数: 668, 转人工数: 134, 候选知识: 18 },
  { date: "4/27", 总会话数: 915, 有效会话数: 714, 转人工数: 151, 候选知识: 22 },
  { date: "4/28", 总会话数: 978, 有效会话数: 763, 转人工数: 172, 候选知识: 24 },
  { date: "4/29", 总会话数: 934, 有效会话数: 729, 转人工数: 149, 候选知识: 19 },
  { date: "4/30", 总会话数: 1088, 有效会话数: 856, 转人工数: 182, 候选知识: 28 },
  { date: "5/1", 总会话数: 1016, 有效会话数: 802, 转人工数: 164, 候选知识: 25 },
  { date: "5/2", 总会话数: 1124, 有效会话数: 879, 转人工数: 189, 候选知识: 31 },
  { date: "5/3", 总会话数: 1192, 有效会话数: 932, 转人工数: 205, 候选知识: 34 },
  { date: "5/4", 总会话数: 1076, 有效会话数: 841, 转人工数: 176, 候选知识: 27 },
  { date: "5/5", 总会话数: 1218, 有效会话数: 956, 转人工数: 211, 候选知识: 36 },
  { date: "5/6", 总会话数: 1286, 有效会话数: 1004, 转人工数: 224, 候选知识: 38 },
  { date: "5/7", 总会话数: 1174, 有效会话数: 918, 转人工数: 193, 候选知识: 30 },
  { date: "5/8", 总会话数: 1308, 有效会话数: 1019, 转人工数: 231, 候选知识: 41 },
  { date: "5/9", 总会话数: 1246, 有效会话数: 973, 转人工数: 199, 候选知识: 33 },
];

const sourcePipelineData = [
  { date: "5/3", 客服工作台对话: 16, ERP工单: 9, 文件同步: 6 },
  { date: "5/4", 客服工作台对话: 14, ERP工单: 8, 文件同步: 7 },
  { date: "5/5", 客服工作台对话: 19, ERP工单: 11, 文件同步: 6 },
  { date: "5/6", 客服工作台对话: 23, ERP工单: 12, 文件同步: 8 },
  { date: "5/7", 客服工作台对话: 18, ERP工单: 10, 文件同步: 5 },
  { date: "5/8", 客服工作台对话: 26, ERP工单: 14, 文件同步: 9 },
  { date: "5/9", 客服工作台对话: 21, ERP工单: 12, 文件同步: 7 },
];

function Index() {
  const entries = useKnowledgeStore();
  const libraries = useKnowledgeLibraries();
  const sessionPending = entries.filter(
    (entry) => entry.sourceType === "session" && entry.status === "审核中",
  ).length;
  const ticketPending = entries.filter(
    (entry) => entry.sourceType === "ticket" && entry.status === "审核中",
  ).length;
  const approved = entries.filter((entry) => entry.status === "已通过").length;
  const lowConfidence = entries.filter((entry) => entry.confidence < 0.3).length;
  const totalLibraryEntries = libraries.reduce((sum, library) => sum + library.total, 0);

  return (
    <div>
      <PageHeader
        title="后台运营总览"
        description="统一查看客服工作台数据看板、对话候选入库、ERP 工单入库和知识库治理状态"
        actions={
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            导出后台日报
          </Button>
        }
      />
      <FilterBar />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="总会话数"
          value="12,486"
          delta={12.4}
          icon={MessageCircle}
          accent="primary"
        />
        <StatCard
          label="有效会话数"
          value="9,732"
          delta={8.1}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="有效会话转人工"
          value="1,564"
          delta={4.6}
          icon={UserCheck}
          accent="warning"
        />
        <StatCard
          label="直接转人工"
          value="426"
          delta={-1.8}
          icon={ArrowRightLeft}
          accent="warning"
        />
        <StatCard
          label="正式知识条目"
          value={totalLibraryEntries.toLocaleString()}
          delta={6.2}
          icon={Database}
          accent="info"
        />
      </div>

      <section className="mb-6 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">入库审核总览</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              后台只处理候选知识、工单闭环和知识库质量，不承接客服前台对话操作
            </p>
          </div>
          <Badge variant="outline">SLA：高频候选 24 小时内处理</Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <PipelineCard
            icon={MessageCircle}
            label="客服工作台对话"
            value={sessionPending}
            caption="待审核场景块"
            tone="warning"
          />
          <PipelineCard
            icon={Ticket}
            label="ERP 工单"
            value={ticketPending}
            caption="待审核 scene_id"
            tone="info"
          />
          <PipelineCard
            icon={FileCheck2}
            label="已生效候选"
            value={approved}
            caption="本地 demo 已通过"
            tone="success"
          />
          <PipelineCard
            icon={Database}
            label="低置信度复核"
            value={lowConfidence}
            caption="低于 30% 自动进入治理视图"
            tone="destructive"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">客服工作台基础看板</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                近 14 天会话量、有效会话与转人工趋势
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="总会话数"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="有效会话数"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="转人工数"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">知识入库来源趋势</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                客服对话、ERP 工单和文件同步的候选知识量
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sourcePipelineData}>
              <defs>
                <linearGradient id="sessionPipeline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ticketPipeline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="filePipeline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="客服工作台对话"
                stackId="1"
                stroke="var(--chart-1)"
                fill="url(#sessionPipeline)"
              />
              <Area
                type="monotone"
                dataKey="ERP工单"
                stackId="1"
                stroke="var(--chart-2)"
                fill="url(#ticketPipeline)"
              />
              <Area
                type="monotone"
                dataKey="文件同步"
                stackId="1"
                stroke="var(--chart-4)"
                fill="url(#filePipeline)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PipelineCard({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: number;
  caption: string;
  tone: "warning" | "success" | "destructive" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "text-success bg-success/10"
      : tone === "warning"
        ? "text-warning bg-warning/10"
        : tone === "destructive"
          ? "text-destructive bg-destructive/10"
          : "text-info bg-info/10";
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <div className="mt-3 text-sm font-medium">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{caption}</div>
    </div>
  );
}
