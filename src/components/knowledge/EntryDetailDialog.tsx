import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  User,
  Headphones,
  Settings2,
  Clock,
  UserCircle2,
  Paperclip,
  Tag,
  Package,
  Cpu,
  UserCheck,
  Wrench,
  Database,
  ShieldCheck,
  Gauge,
  LibraryBig,
  Sparkles,
  ListChecks,
  MessageSquareText,
} from "lucide-react";
import type { KnowledgeEntry, DialogMessage } from "@/lib/knowledge-store";

const roleMeta: Record<DialogMessage["role"], { label: string; icon: typeof Bot; cls: string }> = {
  user: { label: "客户", icon: User, cls: "bg-muted text-foreground" },
  bot: { label: "AI", icon: Bot, cls: "bg-primary/10 text-primary" },
  agent: { label: "客服", icon: Headphones, cls: "bg-success/10 text-success" },
  system: { label: "系统", icon: Settings2, cls: "bg-warning/10 text-warning" },
};

export function EntryDetailDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: KnowledgeEntry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!entry) return null;
  const isSession = entry.sourceType === "session";
  const isTicket = entry.sourceType === "ticket";
  const aiQuestion = entry.question ?? entry.messages?.find((m) => m.role === "user")?.text;
  const aiAnswer = entry.answer ?? entry.content;
  const sopSteps = splitSop(entry.actions);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{entry.categoryName}</Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              {entry.sourceIds.join(", ")}
            </Badge>
            <Badge>{entry.status}</Badge>
            <Badge variant="outline">{entry.sourceSystem}</Badge>
          </div>
          <DialogTitle className="text-left">{entry.title}</DialogTitle>
          <DialogDescription className="text-left">{entry.summary}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border rounded-md p-3 bg-muted/30">
          <InfoRow icon={LibraryBig} label="目标知识库" value={entry.targetLibraryName} />
          <InfoRow icon={Database} label="来源系统" value={entry.sourceSystem} />
          <InfoRow
            icon={Gauge}
            label="初始置信度"
            value={`${Math.round(entry.initialConfidence * 100)}%`}
          />
          <InfoRow
            icon={ShieldCheck}
            label="数据治理"
            value={`${entry.dataLevel} / 风险${entry.riskLevel} / ${entry.syncStatus}`}
          />
          {isTicket && (
            <>
              <InfoRow icon={Tag} label="工单类型" value={entry.ticketType} />
              <InfoRow icon={Package} label="产品分类" value={entry.productCategory} />
              <InfoRow icon={Cpu} label="产品型号" value={entry.productModel} />
              <InfoRow icon={UserCheck} label="提单人" value={entry.applicant} />
              <InfoRow icon={Wrench} label="处理人" value={entry.handler} />
            </>
          )}
          <InfoRow
            icon={UserCircle2}
            label="推送人"
            value={entry.submitter ?? (isSession ? "客服工作台" : "ERP 工单系统")}
          />
          <InfoRow icon={Clock} label="时间" value={entry.conversationAt ?? entry.submittedAt} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <ProcessStep index="1" label={isTicket ? "原始工单详情已提交" : "原始详细对话已提交"} />
          <ProcessStep index="2" label="AI 已提炼标题、摘要、QA、SOP" />
          <ProcessStep
            index="3"
            label={entry.status === "已通过" ? "审核完成并入库" : "等待入库审核"}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-md border p-3 text-xs">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" />
            AI 提炼结果
          </div>
          <ReviewLine label="标题摘要" value={`${entry.title}：${entry.summary}`} />
          <ReviewLine label="具体 QA" value={`Q：${aiQuestion ?? entry.title}\nA：${aiAnswer}`} />
          <ReviewLine
            label="具体 SOP"
            value={
              sopSteps.length > 0
                ? sopSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")
                : "等待 AI 补充 SOP"
            }
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {isTicket ? "scene_id" : "scene"}
            </Badge>
            <span>{entry.sceneId ?? "未拆分场景块"}</span>
          </div>
          <ReviewLine label="Case" value={entry.caseSummary ?? entry.summary} />
          <ReviewLine label="Actions" value={entry.actions ?? "等待审核人补充处理动作"} />
          <ReviewLine label="Result" value={entry.result ?? "等待审核人确认最终结论"} />
          {entry.reviewReason && <ReviewLine label="审核原因" value={entry.reviewReason} />}
          {entry.duplicateHint && <ReviewLine label="疑似重复" value={entry.duplicateHint} />}
        </div>

        {isTicket && entry.attachments && entry.attachments.length > 0 && (
          <div className="border rounded-md p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              附件 ({entry.attachments.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-muted/30 text-xs"
                >
                  <Paperclip className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground">{a.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {isTicket ? (
              <ListChecks className="w-3.5 h-3.5" />
            ) : (
              <MessageSquareText className="w-3.5 h-3.5" />
            )}
            {isTicket ? "原始工单详情" : "原始详细对话"}
          </div>
          <ScrollArea className="h-[320px] rounded-md border p-3">
            <div className="space-y-3">
              {(entry.messages ?? []).length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">
                  暂无详细对话记录
                </div>
              )}
              {(entry.messages ?? []).map((m, idx) => {
                const meta = roleMeta[m.role];
                const Icon = meta.icon;
                const mine = m.role === "agent" || m.role === "bot";
                return (
                  <div key={idx} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${meta.cls}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div
                      className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}
                    >
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{m.name}</span>
                        <span>·</span>
                        <span>{m.time}</span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProcessStep({ index, label }: { index: string; label: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
        {index}
      </div>
      <div className="font-medium leading-snug">{label}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bot;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground shrink-0">{label}：</span>
      <span className="font-medium truncate">{value ?? "—"}</span>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-2">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="whitespace-pre-line text-foreground">{value}</span>
    </div>
  );
}

function splitSop(actions?: string) {
  return (actions ?? "")
    .split(/[；;\n]/)
    .map((step) => step.trim())
    .filter(Boolean);
}
