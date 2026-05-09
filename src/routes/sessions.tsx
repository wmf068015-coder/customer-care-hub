import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, ExternalLink, RotateCcw } from "lucide-react";
import { useKnowledgeStore, setEntryStatus, type ReviewStatus, type KnowledgeEntry } from "@/lib/knowledge-store";
import { toast } from "sonner";

export const Route = createFileRoute("/sessions")({ component: Page });

function Page() {
  const all = useKnowledgeStore().filter((e) => e.sourceType === "session");
  const pending = all.filter((e) => e.status === "审核中");
  const rejected = all.filter((e) => e.status === "已驳回");
  const approved = all.filter((e) => e.status === "已通过");

  const review = (id: string, status: ReviewStatus) => {
    setEntryStatus(id, status);
    toast.success(status === "已通过" ? "已通过并备份至知识库" : status === "已驳回" ? "已驳回该入库申请" : "已重新提交审核");
  };

  return (
    <div>
      <PageHeader
        title="客服对话入库管理"
        description="审核客服工作台回传的对话入库申请，通过后自动备份至知识库"
        actions={
          <Button variant="outline" asChild className="gap-2">
            <a href="https://zen-desk-assist.lovable.app/" target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" />打开客服工作台
            </a>
          </Button>
        }
      />
      <div className="bg-card rounded-lg border shadow-[var(--shadow-card)] p-4">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1">
              待审核{pending.length > 0 && <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-warning/20 text-warning text-[10px] font-medium">{pending.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="rejected">已驳回{rejected.length > 0 && ` (${rejected.length})`}</TabsTrigger>
            <TabsTrigger value="approved">已通过{approved.length > 0 && ` (${approved.length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingTable rows={pending} onPass={(id) => review(id, "已通过")} onReject={(id) => review(id, "已驳回")} />
          </TabsContent>
          <TabsContent value="rejected">
            <HistoryTable rows={rejected} variant="rejected" onRestore={(id) => review(id, "审核中")} />
          </TabsContent>
          <TabsContent value="approved">
            <HistoryTable rows={approved} variant="approved" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PendingTable({ rows, onPass, onReject }: { rows: KnowledgeEntry[]; onPass: (id: string) => void; onReject: (id: string) => void }) {
  if (rows.length === 0) return <div className="py-12 text-center text-sm text-muted-foreground">暂无待审核入库申请</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>申请 ID</TableHead><TableHead>标题 / 摘要</TableHead><TableHead>类目</TableHead>
          <TableHead>来源会话</TableHead><TableHead>提交时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-mono text-xs">{e.id}</TableCell>
            <TableCell>
              <div className="font-medium">{e.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{e.summary}</div>
            </TableCell>
            <TableCell><Badge variant="outline">{e.categoryName}</Badge></TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{e.sourceIds.join(", ")}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{e.submittedAt}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button size="sm" className="h-8 gap-1 bg-success hover:bg-success/90 text-white" onClick={() => onPass(e.id)}>
                  <Check className="w-3 h-3" />通过
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => onReject(e.id)}>
                  <X className="w-3 h-3" />驳回
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HistoryTable({ rows, variant, onRestore }: { rows: KnowledgeEntry[]; variant: "approved" | "rejected"; onRestore?: (id: string) => void }) {
  if (rows.length === 0) return <div className="py-12 text-center text-sm text-muted-foreground">{variant === "approved" ? "暂无已通过入库记录" : "暂无驳回记录"}</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>申请 ID</TableHead><TableHead>标题</TableHead><TableHead>类目</TableHead>
          <TableHead>来源会话</TableHead><TableHead>审核时间</TableHead>
          {onRestore && <TableHead className="text-right">操作</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-mono text-xs">{e.id}</TableCell>
            <TableCell className="font-medium">{e.title}</TableCell>
            <TableCell><Badge variant="outline">{e.categoryName}</Badge></TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{e.sourceIds.join(", ")}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{e.reviewedAt ?? "—"}</TableCell>
            {onRestore && (
              <TableCell className="text-right">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => onRestore(e.id)}>
                  <RotateCcw className="w-3 h-3" />重新提审
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}