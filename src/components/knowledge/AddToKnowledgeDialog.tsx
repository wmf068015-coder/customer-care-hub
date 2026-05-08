import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookPlus, Sparkles } from "lucide-react";
import { addKnowledgeEntry } from "@/lib/knowledge-store";

export type KnowledgeSource = {
  id: string;
  title: string;
  summary?: string;
  channel?: string;
  type: "session" | "ticket";
};

const categories = [
  { id: "product", name: "产品手册" },
  { id: "return", name: "退换货政策" },
  { id: "logistics", name: "物流配送" },
  { id: "after", name: "售后服务" },
  { id: "complaint", name: "投诉处理" },
  { id: "tech", name: "技术支持" },
];

function guessCategory(text: string): string {
  if (/退|换/.test(text)) return "return";
  if (/物流|发货|快递/.test(text)) return "logistics";
  if (/投诉|赔/.test(text)) return "complaint";
  if (/登录|账户|技术|异常|失败/.test(text)) return "tech";
  if (/保修|售后|维修/.test(text)) return "after";
  return "product";
}

export function AddToKnowledgeDialog({
  open,
  onOpenChange,
  sources,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sources: KnowledgeSource[];
}) {
  const first = sources[0];
  const [category, setCategory] = useState("product");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !first) return;
    const isBatch = sources.length > 1;
    const t = isBatch ? `批量沉淀：${sources.length} 条${first.type === "session" ? "会话" : "工单"}` : first.title;
    setTitle(t);
    setSummary(isBatch ? sources.map((s) => `· ${s.title}`).join("\n") : (first.summary ?? ""));
    setContent("");
    setCategory(guessCategory(t + " " + (first.summary ?? "")));
    setTags(first.channel ?? "");
  }, [open, sources, first]);

  if (!first) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("请填写知识标题");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    const cat = categories.find((c) => c.id === category)!;
    addKnowledgeEntry({
      sourceIds: sources.map((s) => s.id),
      sourceType: first.type,
      category: cat.id,
      categoryName: cat.name,
      title,
      summary,
      content,
      tags,
    });
    setSubmitting(false);
    onOpenChange(false);
    toast.success(`已提交至「${cat.name}」审核中`, {
      description: `共 ${sources.length} 条记录沉淀，置信度初始 60，待审核后生效`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-primary" />
            加入知识库
          </DialogTitle>
          <DialogDescription>
            将选中的{first.type === "session" ? "会话" : "工单"}沉淀为知识条目，提交后进入审核流程，审核通过后将自动同步至 AI 客服与工作台。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">来源记录</span>
              <Badge variant="outline">{sources.length} 条</Badge>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{s.id}</span>
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>所属类目</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>标签 <span className="text-muted-foreground text-xs">（逗号分隔）</span></Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例如：退货, 物流" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>知识标题</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>摘要</Label>
            <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="一句话概括该知识点..." />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>正文内容</Label>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                onClick={() => {
                  setContent(`基于 ${sources.length} 条${first.type === "session" ? "会话" : "工单"}自动生成的标准答复草稿：\n\n${summary}\n\n建议处理流程：\n1. 倾听并确认客户问题\n2. 给出明确解决方案\n3. 跟进结果`);
                  toast.info("已生成 AI 草稿，请审核后再提交");
                }}>
                <Sparkles className="w-3 h-3" />AI 生成草稿
              </Button>
            </div>
            <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="详细的知识内容、解决步骤、话术..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "提交审核"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}