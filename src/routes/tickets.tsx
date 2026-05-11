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
import { Check, X, Link2, RotateCcw, Sparkles, ListChecks } from "lucide-react";
import {
  useKnowledgeStore,
  setEntryStatus,
  type ReviewStatus,
  type KnowledgeEntry,
} from "@/lib/knowledge-store";
import { toast } from "sonner";
import { EntryDetailDialog } from "@/components/knowledge/EntryDetailDialog";

export const Route = createFileRoute("/tickets")({ component: Page });

function Page() {
  const all = useKnowledgeStore().filter((e) => e.sourceType === "ticket");
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
          ? "已驳回该工单入库申请"
          : "已重新提交审核",
    );
  };

  return (
    <div>
      <PageHeader
        title="ERP 工单审核入库"
        description="先提交 ERP 原始工单详情，AI 提炼标题摘要、具体 QA、具体 SOP 和基本信息后，再进入入库审核"
        actions={
          <Button variant="outline" className="gap-2">
            <Link2 className="w-4 h-4" />
            连接 ERP 工单系统
          </Button>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <SummaryCard label="原始工单详情已提交" value={all.length} tone="info" />
        <SummaryCard label="AI提炼结果待审核" value={pending.length} tone="warning" />
        <SummaryCard label="审核完成已入库" value={approved.length} tone="success" />
        <SummaryCard
          label="含附件工单"
          value={all.filter((e) => (e.attachments ?? []).length > 0).length}
          tone="info"
        />
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <FlowCard
          step="1"
          title="提交原始工单"
          body="ERP 先回传原始工单详情、附件、处理人、产品型号和闭环结果。"
        />
        <FlowCard
          step="2"
          title="AI提炼结果"
          body="AI 根据工单详情生成标题摘要、具体 QA、具体 SOP、Case / Actions / Result 和风险等级建议。"
        />
        <FlowCard
          step="3"
          title="入库审核"
          body={`管理员查看原始工单详情和 AI 处理结果后审核，平均初始置信度 ${Math.round(avg(all.map((e) => e.initialConfidence)) * 100)}%。`}
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
      <div className="py-12 text-center text-sm text-muted-foreground">暂无待审核工单入库申请</div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>申请 ID</TableHead>
          <TableHead>原始工单详情</TableHead>
          <TableHead>AI提炼结果</TableHead>
          <TableHead>目标知识库</TableHead>
          <TableHead>产品 / 处理人</TableHead>
          <TableHead>附件</TableHead>
          <TableHead>入库审核</TableHead>
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
              <div className="flex items-center gap-1.5 font-medium">
                <ListChecks className="w-3.5 h-3.5 text-primary" />
                {e.sourceIds.join(", ")}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                原始工单详情已提交，可查看完整处理记录
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="font-mono text-[10px]">
                  scene_id {e.sceneId}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {e.ticketType}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <AiResultPreview entry={e} />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Badge variant="outline">{e.targetLibraryName}</Badge>
                <div className="text-xs text-muted-foreground">{e.categoryName}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">{e.productModel ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{e.handler ?? "未分配"}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{(e.attachments ?? []).length} 个</Badge>
            </TableCell>
            <TableCell>
              <Badge className="bg-warning/15 text-warning hover:bg-warning/15">待入库审核</Badge>
            </TableCell>
            <TableCell>
              <Confidence value={e.initialConfidence} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{e.submittedAt}</TableCell>
            <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" className="h-8" onClick={() => onView(e)}>
                  查看原文/AI结果
                </Button>
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
          <TableHead>AI提炼结果</TableHead>
          <TableHead>目标知识库</TableHead>
          <TableHead>原始工单详情</TableHead>
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
            <TableCell>
              <AiResultPreview entry={e} />
            </TableCell>
            <TableCell>
              <Badge variant="outline">{e.targetLibraryName}</Badge>
            </TableCell>
            <TableCell>
              <div className="font-mono text-xs text-muted-foreground">
                {e.sourceIds.join(", ")}
              </div>
              <div className="text-xs text-muted-foreground">原始工单详情可查看</div>
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

function FlowCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {step}
      </div>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">{body}</div>
    </div>
  );
}

function AiResultPreview({ entry }: { entry: KnowledgeEntry }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        {entry.title}
      </div>
      <div className="line-clamp-1 text-xs text-muted-foreground">{entry.summary}</div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px]">
          具体 QA
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          具体 SOP
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          AI处理完成
        </Badge>
      </div>
    </div>
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
