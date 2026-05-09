import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, ExternalLink, RotateCcw } from "lucide-react";
import {
  useKnowledgeStore,
  setEntryStatus,
  type ReviewStatus,
  type KnowledgeEntry,
} from "@/lib/knowledge-store";
import { toast } from "sonner";
import { EntryDetailDialog } from "@/components/knowledge/EntryDetailDialog";

export const Route = createFileRoute("/sessions")({ component: Page });

function Page() {
  const all = useKnowledgeStore().filter((e) => e.sourceType === "session");
  const pending = all.filter((e) => e.status === "审核中");
  const rejected = all.filter((e) => e.status === "已驳回");
  const approved = all.filter((e) => e.status === "已通过");
  const [detail, setDetail] = useState<KnowledgeEntry | null>(null);

  const review = (id: string, status: ReviewStatus) => {
    setEntryStatus(id, status);
    toast.success(
      status === "已通过"
        ? "已通过并备份至知识库"
        : status === "已驳回"
          ? "已驳回该入库申请"
          : "已重新提交审核",
    );
  };

  return (
    <div>
      <PageHeader
        title="客服工作台对话审核入库"
        description="审核客服工作台推送的对话场景块，确认 Case / Actions / Result 后入库给 AI 客服使用"
        actions={
          <Button variant="outline" asChild className="gap-2">
            <a href="https://zen-desk-assist.lovable.app/" target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" />
              打开客服工作台
            </a>
          </Button>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <SummaryCard label="待审核场景块" value={pending.length} tone="warning" />
        <SummaryCard label="已入库对话知识" value={approved.length} tone="success" />
        <SummaryCard label="待合并/驳回" value={rejected.length} tone="destructive" />
        <SummaryCard
          label="平均初始置信度"
          value={`${Math.round(avg(all.map((e) => e.initialConfidence)) * 100)}%`}
          tone="info"
        />
      </div>
      <div className="bg-card rounded-lg border shadow-[var(--shadow-card)] p-4">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1">
              待审核
              {pending.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-warning/20 text-warning text-[10px] font-medium">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              已驳回{rejected.length > 0 && ` (${rejected.length})`}
            </TabsTrigger>
            <TabsTrigger value="approved">
              已通过{approved.length > 0 && ` (${approved.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingTable
              rows={pending}
              onPass={(id) => review(id, "已通过")}
              onReject={(id) => review(id, "已驳回")}
              onView={setDetail}
            />
          </TabsContent>
          <TabsContent value="rejected">
            <HistoryTable
              rows={rejected}
              variant="rejected"
              onRestore={(id) => review(id, "审核中")}
              onView={setDetail}
            />
          </TabsContent>
          <TabsContent value="approved">
            <HistoryTable rows={approved} variant="approved" onView={setDetail} />
          </TabsContent>
        </Tabs>
      </div>
      <EntryDetailDialog
        entry={detail}
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
      />
    </div>
  );
}

function PendingTable({
  rows,
  onPass,
  onReject,
  onView,
}: {
  rows: KnowledgeEntry[];
  onPass: (id: string) => void;
  onReject: (id: string) => void;
  onView: (e: KnowledgeEntry) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">暂无待审核入库申请</div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>申请 ID</TableHead>
          <TableHead>标题 / 场景块</TableHead>
          <TableHead>目标知识库</TableHead>
          <TableHead>来源会话</TableHead>
          <TableHead>初始置信度</TableHead>
          <TableHead>提交时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((e) => (
          <TableRow
            key={e.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onView(e)}
          >
            <TableCell className="font-mono text-xs">{e.id}</TableCell>
            <TableCell>
              <div className="font-medium">{e.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{e.summary}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="font-mono text-[10px]">
                  场景块 {e.sceneId}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {e.caseSummary}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Badge variant="outline">{e.targetLibraryName}</Badge>
                <div className="text-xs text-muted-foreground">{e.categoryName}</div>
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {e.sourceIds.join(", ")}
            </TableCell>
            <TableCell>
              <Confidence value={e.initialConfidence} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{e.submittedAt}</TableCell>
            <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  className="h-8 gap-1 bg-success hover:bg-success/90 text-white"
                  onClick={() => onPass(e.id)}
                >
                  <Check className="w-3 h-3" />
                  通过
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => onReject(e.id)}
                >
                  <X className="w-3 h-3" />
                  驳回
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HistoryTable({
  rows,
  variant,
  onRestore,
  onView,
}: {
  rows: KnowledgeEntry[];
  variant: "approved" | "rejected";
  onRestore?: (id: string) => void;
  onView: (e: KnowledgeEntry) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {variant === "approved" ? "暂无已通过入库记录" : "暂无驳回记录"}
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>申请 ID</TableHead>
          <TableHead>标题</TableHead>
          <TableHead>目标知识库</TableHead>
          <TableHead>来源会话</TableHead>
          <TableHead>审核时间</TableHead>
          {onRestore && <TableHead className="text-right">操作</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((e) => (
          <TableRow
            key={e.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onView(e)}
          >
            <TableCell className="font-mono text-xs">{e.id}</TableCell>
            <TableCell className="font-medium">{e.title}</TableCell>
            <TableCell>
              <Badge variant="outline">{e.targetLibraryName}</Badge>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {e.sourceIds.join(", ")}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{e.reviewedAt ?? "—"}</TableCell>
            {onRestore && (
              <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={() => onRestore(e.id)}
                >
                  <RotateCcw className="w-3 h-3" />
                  重新提审
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
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
    <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-2 inline-flex rounded-md px-2.5 py-1 text-xl font-semibold ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls = pct >= 70 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive";
  return <span className={`font-medium ${cls}`}>{pct}%</span>;
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
