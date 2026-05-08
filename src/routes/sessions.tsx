import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookPlus, ExternalLink } from "lucide-react";
import { AddToKnowledgeDialog } from "@/components/knowledge/AddToKnowledgeDialog";

export const Route = createFileRoute("/sessions")({ component: Page });

const sessions = Array.from({ length: 12 }).map((_, i) => ({
  id: `S${30000 + i}`,
  user: `客户 ${2048 + i}`,
  channel: ["桌面网站", "移动网站", "Shopify"][i % 3],
  topic: ["退款进度查询", "物流时效咨询", "产品规格问题", "优惠券使用", "账户登录异常"][i % 5],
  agent: ["AI 客服", "Lisa", "Mike", "AI 客服"][i % 4],
  status: ["已结束", "进行中", "已结束"][i % 3],
  duration: `${3 + (i % 12)}m ${10 + i}s`,
  time: `2026-05-08 1${i % 9}:30`,
}));

function Page() {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const allSelected = selected.length === sessions.length;
  return (
    <div>
      <PageHeader
        title="客服会话管理"
        description="管理 AI 与人工客服的所有会话记录，可批量加入知识库"
        actions={
          <>
            <Button variant="outline" asChild className="gap-2">
              <a href="https://zen-desk-assist.lovable.app/" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" />打开客服工作台
              </a>
            </Button>
            <Button disabled={selected.length === 0} className="gap-2" onClick={() => setOpen(true)}>
              <BookPlus className="w-4 h-4" />加入知识库 {selected.length > 0 && `(${selected.length})`}
            </Button>
          </>
        }
      />
      <div className="bg-card rounded-lg border shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(c) => setSelected(c ? sessions.map((s) => s.id) : [])} />
              </TableHead>
              <TableHead>会话 ID</TableHead><TableHead>用户</TableHead><TableHead>渠道</TableHead>
              <TableHead>主题</TableHead><TableHead>处理客服</TableHead><TableHead>时长</TableHead>
              <TableHead>开始时间</TableHead><TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id} className={selected.includes(s.id) ? "bg-primary/5" : ""}>
                <TableCell><Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} /></TableCell>
                <TableCell className="font-mono text-xs">{s.id}</TableCell>
                <TableCell>{s.user}</TableCell>
                <TableCell><Badge variant="outline">{s.channel}</Badge></TableCell>
                <TableCell className="font-medium">{s.topic}</TableCell>
                <TableCell>{s.agent}</TableCell>
                <TableCell className="text-muted-foreground">{s.duration}</TableCell>
                <TableCell className="text-muted-foreground">{s.time}</TableCell>
                <TableCell>
                  <Badge className={s.status === "进行中" ? "bg-info/15 text-info hover:bg-info/15" : "bg-muted text-muted-foreground hover:bg-muted"}>{s.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AddToKnowledgeDialog
        open={open}
        onOpenChange={setOpen}
        sources={sessions
          .filter((s) => selected.includes(s.id))
          .map((s) => ({ id: s.id, title: s.topic, summary: `${s.user} 通过${s.channel}发起，处理人 ${s.agent}，时长 ${s.duration}`, channel: s.channel, type: "session" as const }))}
      />
    </div>
  );
}