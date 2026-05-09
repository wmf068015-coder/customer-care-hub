import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  Bot,
  ArrowRightLeft,
  MousePointerClick,
  Headphones,
  Zap,
  Frown,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/transfer")({ component: TransferPage });

const records = Array.from({ length: 8 }).map((_, i) => ({
  id: `T${10000 + i}`,
  user: `游客 ${1024 + i}`,
  channel: ["桌面网站", "移动网站", "Shopify"][i % 3],
  type: i % 2 ? "机器人触发" : "客户主动",
  reason: ["AI 无法回答", "情绪负向", "重要问题", "用户点击"][i % 4],
  time: `2026-05-0${(i % 8) + 1} 14:${20 + i}:00`,
  status: i % 3 === 0 ? "已响应" : "等待中",
}));

function TransferPage() {
  return (
    <div>
      <PageHeader title="转人工统计" description="客户转人工的来源、原因与响应分析" />
      <FilterBar />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="转人工会话总数"
          value="1,990"
          delta={5.2}
          icon={UserCheck}
          accent="primary"
        />
        <StatCard label="机器人触发转人工" value="1,254" delta={3.8} icon={Bot} accent="info" />
        <StatCard
          label="直接转人工"
          value="736"
          delta={-1.4}
          icon={ArrowRightLeft}
          accent="warning"
        />
      </div>

      <Tabs defaultValue="active" className="mb-6">
        <TabsList>
          <TabsTrigger value="active">客户主动转人工</TabsTrigger>
          <TabsTrigger value="bot">机器人触发转人工</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="主动点击转人工"
              value="736"
              icon={MousePointerClick}
              accent="primary"
            />
            <StatCard label="人工响应数" value="682" icon={Headphones} accent="success" />
          </div>
        </TabsContent>
        <TabsContent value="bot" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="自动触发数" value="824" icon={Zap} accent="info" />
            <StatCard label="情绪负向触发数" value="246" icon={Frown} accent="warning" />
            <StatCard label="重要问题转人工" value="184" icon={AlertCircle} accent="primary" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-card rounded-lg border shadow-[var(--shadow-card)]">
        <div className="p-5 border-b">
          <h3 className="font-semibold">转人工会话记录</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>会话 ID</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>渠道</TableHead>
              <TableHead>转人工类型</TableHead>
              <TableHead>原因</TableHead>
              <TableHead>时间</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell>{r.user}</TableCell>
                <TableCell>{r.channel}</TableCell>
                <TableCell>
                  <Badge variant={r.type === "机器人触发" ? "secondary" : "outline"}>
                    {r.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.reason}</TableCell>
                <TableCell className="text-muted-foreground">{r.time}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      r.status === "已响应"
                        ? "bg-success/15 text-success hover:bg-success/15"
                        : "bg-warning/15 text-warning hover:bg-warning/15"
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
