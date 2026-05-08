import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookPlus, Link2 } from "lucide-react";
import { AddToKnowledgeDialog } from "@/components/knowledge/AddToKnowledgeDialog";
import { useKnowledgeStore, statusForSource, type ReviewStatus } from "@/lib/knowledge-store";

function KbStatus({ status }: { status: ReviewStatus | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const cls =
    status === "已通过"
      ? "bg-success/15 text-success hover:bg-success/15"
      : status === "已驳回"
        ? "bg-destructive/15 text-destructive hover:bg-destructive/15"
        : "bg-warning/15 text-warning hover:bg-warning/15";
  return <Badge className={cls}>{status}</Badge>;
}

export const Route = createFileRoute("/tickets")({ component: Page });

const tickets = Array.from({ length: 10 }).map((_, i) => ({
  id: `#TK-${5000 + i}`,
  subject: ["订单未发货跟进", "退款迟迟未到账", "商品损坏理赔", "重复扣款问题", "无法登录账户"][i % 5],
  priority: ["高", "中", "低"][i % 3],
  status: ["处理中", "待回复", "已关闭"][i % 3],
  assignee: ["Lisa", "Mike", "Anna", "John"][i % 4],
  created: `2026-05-0${(i % 8) + 1}`,
}));

const priorityCls: Record<string, string> = {
  高: "bg-destructive/15 text-destructive hover:bg-destructive/15",
  中: "bg-warning/15 text-warning hover:bg-warning/15",
  低: "bg-muted text-muted-foreground hover:bg-muted",
};

function Page() {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const entries = useKnowledgeStore();
  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  return (
    <div>
      <PageHeader
        title="工单管理"
        description="对接外部工单系统，可批量将工单沉淀进知识库"
        actions={
          <>
            <Button variant="outline" className="gap-2"><Link2 className="w-4 h-4" />连接工单系统</Button>
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
              <TableHead className="w-10"></TableHead>
              <TableHead>工单号</TableHead><TableHead>主题</TableHead><TableHead>优先级</TableHead>
              <TableHead>状态</TableHead><TableHead>负责人</TableHead><TableHead>创建时间</TableHead>
              <TableHead>知识库</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id} className={selected.includes(t.id) ? "bg-primary/5" : ""}>
                <TableCell><Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} /></TableCell>
                <TableCell className="font-mono text-xs">{t.id}</TableCell>
                <TableCell className="font-medium">{t.subject}</TableCell>
                <TableCell><Badge className={priorityCls[t.priority]}>{t.priority}</Badge></TableCell>
                <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                <TableCell>{t.assignee}</TableCell>
                <TableCell className="text-muted-foreground">{t.created}</TableCell>
                <TableCell><KbStatus status={statusForSource(t.id, entries)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AddToKnowledgeDialog
        open={open}
        onOpenChange={setOpen}
        sources={tickets
          .filter((t) => selected.includes(t.id))
          .map((t) => ({ id: t.id, title: t.subject, summary: `优先级 ${t.priority} · 状态 ${t.status} · 负责人 ${t.assignee}`, type: "ticket" as const }))}
      />
    </div>
  );
}