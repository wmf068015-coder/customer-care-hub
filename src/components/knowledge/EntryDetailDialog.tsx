import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Headphones, Settings2, Clock, UserCircle2, Paperclip, Tag, Package, Cpu, UserCheck, Wrench } from "lucide-react";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{entry.categoryName}</Badge>
            <Badge variant="secondary" className="font-mono text-xs">{entry.sourceIds.join(", ")}</Badge>
            <Badge>{entry.status}</Badge>
          </div>
          <DialogTitle className="text-left">{entry.title}</DialogTitle>
          <DialogDescription className="text-left">{entry.summary}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border rounded-md p-3 bg-muted/30">
          {isTicket && (
            <>
              <InfoRow icon={Tag} label="工单类型" value={entry.ticketType} />
              <InfoRow icon={Package} label="产品分类" value={entry.productCategory} />
              <InfoRow icon={Cpu} label="产品型号" value={entry.productModel} />
              <InfoRow icon={UserCheck} label="提单人" value={entry.applicant} />
              <InfoRow icon={Wrench} label="处理人" value={entry.handler} />
            </>
          )}
          <InfoRow icon={UserCircle2} label="推送人" value={entry.submitter ?? (isSession ? "客服工作台" : "ERP 工单系统")} />
          <InfoRow icon={Clock} label="时间" value={entry.conversationAt ?? entry.submittedAt} />
        </div>

        {isTicket && entry.attachments && entry.attachments.length > 0 && (
          <div className="border rounded-md p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />附件 ({entry.attachments.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-muted/30 text-xs">
                  <Paperclip className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground">{a.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0">
          <div className="text-xs font-medium text-muted-foreground mb-2">详细对话</div>
          <ScrollArea className="h-[320px] rounded-md border p-3">
            <div className="space-y-3">
              {(entry.messages ?? []).length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">暂无详细对话记录</div>
              )}
              {(entry.messages ?? []).map((m, idx) => {
                const meta = roleMeta[m.role];
                const Icon = meta.icon;
                const mine = m.role === "agent" || m.role === "bot";
                return (
                  <div key={idx} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${meta.cls}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{m.name}</span>
                        <span>·</span>
                        <span>{m.time}</span>
                      </div>
                      <div className={`rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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

function InfoRow({ icon: Icon, label, value }: { icon: typeof Bot; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground shrink-0">{label}：</span>
      <span className="font-medium truncate">{value ?? "—"}</span>
    </div>
  );
}