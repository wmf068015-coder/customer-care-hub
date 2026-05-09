import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownToLine,
  BookOpen,
  DatabaseZap,
  FileText,
  FilePlus2,
  LibraryBig,
  MessagesSquare,
  MoveRight,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  addKnowledgeEntry,
  addKnowledgeLibrary,
  deleteKnowledgeLibrary,
  moveKnowledgeEntry,
  setEntryStatus,
  useKnowledgeLibraries,
  useKnowledgeStore,
  type KnowledgeEntry,
  type KnowledgeLibrary,
  type NewKnowledgeEntry,
} from "@/lib/knowledge-store";
import { EntryDetailDialog } from "@/components/knowledge/EntryDetailDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/knowledge")({ component: Page });

function Page() {
  const libraries = useKnowledgeLibraries();
  const entries = useKnowledgeStore();
  const [activeLibraryId, setActiveLibraryId] = useState(libraries[0]?.id ?? "kb-product-usage");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<KnowledgeEntry | null>(null);
  const [creatingLibrary, setCreatingLibrary] = useState(false);
  const [creatingKnowledge, setCreatingKnowledge] = useState(false);
  const [movingEntry, setMovingEntry] = useState<KnowledgeEntry | null>(null);
  const [deletingLibrary, setDeletingLibrary] = useState(false);

  const activeLibrary = libraries.find((library) => library.id === activeLibraryId) ?? libraries[0];
  const fallbackLibrary = activeLibrary
    ? (libraries.find((library) => library.id !== activeLibrary.id && library.id === "kb-other") ??
      libraries.find((library) => library.id !== activeLibrary.id))
    : undefined;
  const canDeleteLibrary = Boolean(activeLibrary && fallbackLibrary);

  useEffect(() => {
    if (libraries.length > 0 && !libraries.some((library) => library.id === activeLibraryId)) {
      setActiveLibraryId(libraries[0].id);
    }
  }, [activeLibraryId, libraries]);

  const scopedEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.targetLibraryId === activeLibraryId)
      .filter((entry) => {
        const text = `${entry.title} ${entry.summary} ${entry.tags} ${entry.sourceIds.join(" ")}`;
        return text.toLowerCase().includes(query.trim().toLowerCase());
      });
  }, [activeLibraryId, entries, query]);

  const effective = scopedEntries.filter((entry) => entry.status === "已通过");
  const pending = scopedEntries.filter((entry) => entry.status === "审核中");
  const lowConfidence = scopedEntries.filter(
    (entry) => entry.confidence < 0.3 || entry.reviewReason?.includes("低置信度"),
  );

  const markLowReviewed = (entry: KnowledgeEntry) => {
    setEntryStatus(entry.id, "审核中");
    toast.success("已送入低置信度复核队列", {
      description: `${entry.title} 将由知识库管理员重新确认内容与元数据`,
    });
  };

  const handleLibraryCreated = (library: KnowledgeLibrary) => {
    setActiveLibraryId(library.id);
    setCreatingLibrary(false);
    toast.success("已新增知识库", {
      description: `「${library.name}」已加入公共知识库列表`,
    });
  };

  const handleKnowledgeCreated = (importedCount = 0) => {
    setCreatingKnowledge(false);
    toast.success("已新增知识", {
      description:
        importedCount > 0
          ? `已自动拆解 ${importedCount} 条知识，进入当前知识库待审核列表`
          : "新知识已进入当前知识库的待审核列表",
    });
  };

  const handleKnowledgeMoved = (entry: KnowledgeEntry, targetLibraryId: string) => {
    const moved = moveKnowledgeEntry(entry.id, targetLibraryId);
    if (!moved) {
      toast.error("移动失败", {
        description: "未找到该知识条目，请刷新后重试",
      });
      return;
    }
    setMovingEntry(null);
    toast.success("已移动到其他知识库", {
      description: `「${moved.title}」已移动至「${moved.targetLibraryName}」`,
    });
  };

  const handleLibraryDeleted = () => {
    if (!activeLibrary) return;
    const fallback = deleteKnowledgeLibrary(activeLibrary.id, fallbackLibrary?.id);
    if (!fallback) {
      toast.error("无法删除知识库", {
        description: "至少需要保留一个知识库用于承接知识条目",
      });
      return;
    }
    setDeletingLibrary(false);
    setActiveLibraryId(fallback.id);
    toast.success("已删除知识库", {
      description: `当前条目已迁移至「${fallback.name}」`,
    });
  };

  return (
    <div>
      <PageHeader
        title="公共知识库"
        description="先管理知识库，再进入知识库详情维护库内 QA、对话场景块、工单场景和文件条目"
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => setCreatingLibrary(true)}>
              <LibraryBig className="w-4 h-4" />
              新增知识库
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={!canDeleteLibrary}
              onClick={() => setDeletingLibrary(true)}
            >
              <Trash2 className="w-4 h-4" />
              删除知识库
            </Button>
            <Button variant="outline" className="gap-2">
              <DatabaseZap className="w-4 h-4" />
              触发 ERP 文件同步
            </Button>
            <Button className="gap-2" onClick={() => setCreatingKnowledge(true)}>
              <FilePlus2 className="w-4 h-4" />
              新增知识
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <section className="space-y-3">
          <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <LibraryBig className="w-4 h-4 text-primary" />
              知识库列表
            </div>
            <div className="space-y-2">
              {libraries.map((library) => {
                const active = library.id === activeLibraryId;
                return (
                  <button
                    key={library.id}
                    type="button"
                    onClick={() => setActiveLibraryId(library.id)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{library.name}</div>
                      {library.pending > 0 && (
                        <Badge className="bg-warning/15 text-warning hover:bg-warning/15">
                          待审 {library.pending}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {library.description}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <MiniStat label="条目" value={library.total} />
                      <MiniStat label="生效" value={library.effective} />
                      <MiniStat label="低置信" value={library.lowConfidence} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-lg border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">知识库详情：{activeLibrary?.name}</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{activeLibrary?.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">负责人：{activeLibrary?.ownerDepartment}</Badge>
                  <Badge variant="outline">权限范围：{activeLibrary?.scope}</Badge>
                  <Badge variant="outline">更新：{activeLibrary?.updatedAt}</Badge>
                </div>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索标题、来源 ID、标签..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="effective" className="p-4">
            <TabsList>
              <TabsTrigger value="effective">已生效 ({effective.length})</TabsTrigger>
              <TabsTrigger value="pending">待审核 ({pending.length})</TabsTrigger>
              <TabsTrigger value="low" className="gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                低置信度复核 ({lowConfidence.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="effective">
              <EntryTable rows={effective} onView={setDetail} onMove={setMovingEntry} />
            </TabsContent>
            <TabsContent value="pending">
              <EntryTable rows={pending} onView={setDetail} onMove={setMovingEntry} />
            </TabsContent>
            <TabsContent value="low">
              <EntryTable
                rows={lowConfidence}
                onView={setDetail}
                onMove={setMovingEntry}
                onReview={markLowReviewed}
              />
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <EntryDetailDialog
        entry={detail}
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
      />
      <NewLibraryDialog
        open={creatingLibrary}
        onOpenChange={setCreatingLibrary}
        onCreated={handleLibraryCreated}
      />
      <NewKnowledgeDialog
        open={creatingKnowledge}
        onOpenChange={setCreatingKnowledge}
        library={activeLibrary}
        onCreated={handleKnowledgeCreated}
      />
      <MoveKnowledgeDialog
        open={!!movingEntry}
        entry={movingEntry}
        libraries={libraries}
        onOpenChange={(open) => !open && setMovingEntry(null)}
        onMoved={handleKnowledgeMoved}
      />
      <DeleteLibraryDialog
        open={deletingLibrary}
        library={activeLibrary}
        fallbackLibrary={fallbackLibrary}
        onOpenChange={setDeletingLibrary}
        onConfirm={handleLibraryDeleted}
      />
    </div>
  );
}

function EntryTable({
  rows,
  onView,
  onMove,
  onReview,
}: {
  rows: KnowledgeEntry[];
  onView: (entry: KnowledgeEntry) => void;
  onMove: (entry: KnowledgeEntry) => void;
  onReview?: (entry: KnowledgeEntry) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">当前知识库暂无匹配条目</div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>标题 / 摘要</TableHead>
          <TableHead>目标知识库</TableHead>
          <TableHead>来源</TableHead>
          <TableHead>置信度</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((entry) => (
          <TableRow
            key={entry.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onView(entry)}
          >
            <TableCell className="font-mono text-xs">{entry.id}</TableCell>
            <TableCell>
              <div className="font-medium">{entry.title}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">{entry.summary}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {entry.sceneId}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {entry.categoryName}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{entry.targetLibraryName}</Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">{entry.sourceSystem}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {entry.sourceIds.join(", ")}
              </div>
            </TableCell>
            <TableCell>
              <Confidence value={entry.confidence} />
              <div className="text-[11px] text-muted-foreground">
                初始 {Math.round(entry.initialConfidence * 100)}%
              </div>
            </TableCell>
            <TableCell>
              <Badge>{entry.syncStatus}</Badge>
            </TableCell>
            <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" className="h-8" onClick={() => onView(entry)}>
                  查看
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={() => onMove(entry)}
                >
                  <MoveRight className="w-3 h-3" />
                  移动
                </Button>
                {onReview && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={() => onReview(entry)}
                  >
                    <RefreshCw className="w-3 h-3" />
                    复核
                  </Button>
                )}
                {entry.confidence < 0.3 && (
                  <Button size="sm" variant="ghost" className="h-8 text-destructive">
                    <ArrowDownToLine className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls = pct >= 70 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive";
  return <span className={`font-medium ${cls}`}>{pct}%</span>;
}

function MoveKnowledgeDialog({
  open,
  entry,
  libraries,
  onOpenChange,
  onMoved,
}: {
  open: boolean;
  entry: KnowledgeEntry | null;
  libraries: KnowledgeLibrary[];
  onOpenChange: (open: boolean) => void;
  onMoved: (entry: KnowledgeEntry, targetLibraryId: string) => void;
}) {
  const [targetLibraryId, setTargetLibraryId] = useState("");
  const targetLibraries = useMemo(
    () => libraries.filter((library) => library.id !== entry?.targetLibraryId),
    [entry?.targetLibraryId, libraries],
  );

  useEffect(() => {
    if (!open) return;
    setTargetLibraryId(targetLibraries[0]?.id ?? "");
  }, [open, entry?.id, targetLibraries]);

  if (!entry) return null;

  const submit = () => {
    if (!targetLibraryId) {
      toast.error("请选择目标知识库");
      return;
    }
    onMoved(entry, targetLibraryId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>移动到其他知识库</DialogTitle>
          <DialogDescription>
            将该知识从当前知识库迁移到新的目标知识库，历史来源和审核状态会保留。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="font-medium">{entry.title}</div>
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.summary}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{entry.id}</Badge>
              <Badge variant="secondary">{entry.targetLibraryName}</Badge>
            </div>
          </div>
          <Field label="目标知识库">
            <Select value={targetLibraryId} onValueChange={setTargetLibraryId}>
              <SelectTrigger>
                <SelectValue placeholder="选择目标知识库" />
              </SelectTrigger>
              <SelectContent>
                {targetLibraries.map((library) => (
                  <SelectItem key={library.id} value={library.id}>
                    {library.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {targetLibraries.length === 0 && (
            <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              当前只有一个知识库，无法移动该知识。
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={targetLibraries.length === 0}>
            确认移动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteLibraryDialog({
  open,
  library,
  fallbackLibrary,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  library?: KnowledgeLibrary;
  fallbackLibrary?: KnowledgeLibrary;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除知识库</AlertDialogTitle>
          <AlertDialogDescription>
            确认删除「{library?.name ?? "当前知识库"}」？当前可见知识条目会迁移至「
            {fallbackLibrary?.name ?? "其他知识库"}」，删除后该知识库将不再出现在列表中。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={!library || !fallbackLibrary}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            删除知识库
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type UploadChunk = {
  kind: "pdf" | "conversation";
  title: string;
  summary: string;
  content: string;
  confidence: number;
};

function summarizeUploadFiles(files: File[]) {
  return files.reduce(
    (stats, file) => ({
      pdfCount: stats.pdfCount + (isPdfFile(file) ? 1 : 0),
      conversationCount: stats.conversationCount + (isPdfFile(file) ? 0 : 1),
      estimatedChunks: stats.estimatedChunks + estimateUploadChunks(file),
    }),
    { pdfCount: 0, conversationCount: 0, estimatedChunks: 0 },
  );
}

async function buildEntriesFromUploadedFiles(
  files: File[],
  library: KnowledgeLibrary,
): Promise<NewKnowledgeEntry[]> {
  const entries: NewKnowledgeEntry[] = [];
  for (const [fileIndex, file] of files.entries()) {
    const chunks = await splitUploadedFile(file);
    chunks.forEach((chunk, chunkIndex) => {
      const conversation = chunk.kind === "conversation";
      entries.push({
        sourceIds: [`UPLOAD-${Date.now().toString().slice(-6)}-${fileIndex + 1}-${chunkIndex + 1}`],
        sourceType: conversation ? "session" : "file",
        sourceSystem: conversation ? "对话文件上传" : "PDF 文件上传",
        targetLibraryId: library.id,
        targetLibraryName: library.name,
        entryType: conversation ? "session_case" : "file",
        category: library.id,
        categoryName: library.name.replace(/知识库$/, ""),
        title: chunk.title,
        summary: chunk.summary,
        content: chunk.content,
        tags: [
          library.name,
          conversation ? "对话文件上传" : "PDF文件上传",
          "文件上传自动拆解",
        ].join(", "),
        initialConfidence: chunk.confidence,
        confidence: chunk.confidence,
        riskLevel: conversation ? "中" : "低",
        dataLevel: conversation ? "L2" : "L1",
        caseSummary: chunk.summary,
        actions: "系统根据上传文件自动拆解为知识候选，等待知识运营审核。",
        result: "审核通过后进入正式知识库并同步给 AI 客服检索。",
        reviewReason: "文件上传自动拆解",
        duplicateHint:
          chunkIndex > 0 ? `同源文件「${file.name}」的第 ${chunkIndex + 1} 个拆解片段` : undefined,
      });
    });
  }
  return entries;
}

async function splitUploadedFile(file: File): Promise<UploadChunk[]> {
  const baseName = cleanFileName(file.name);
  if (isPdfFile(file)) {
    const raw = await file.text().catch(() => "");
    const text = normalizeText(raw.replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。,.!?;:：；、\s-]/g, " "));
    const chunks = text.length > 240 ? splitByLength(text, 900) : [];
    const fallbackCount = estimateUploadChunks(file);
    const pdfChunks =
      chunks.length > 0
        ? chunks
        : Array.from({ length: fallbackCount }, (_, index) =>
            [
              `文件：${file.name}`,
              `片段：PDF 自动拆解 ${index + 1}/${fallbackCount}`,
              `大小：${formatFileSize(file.size)}`,
              "待审核时可对照原 PDF 补充页码、图片说明和适用范围。",
            ].join("\n"),
          );
    return pdfChunks.map((chunk, index) => ({
      kind: "pdf",
      title: `${baseName} · PDF 片段 ${index + 1}`,
      summary: `${baseName} PDF 文件自动拆解片段 ${index + 1}/${pdfChunks.length}`,
      content: chunk,
      confidence: 0.55,
    }));
  }

  const text = await file.text().catch(() => "");
  const chunks = splitConversationContent(text);
  return chunks.map((chunk, index) => ({
    kind: "conversation",
    title: `${baseName} · 对话片段 ${index + 1}`,
    summary: summarizeText(chunk, `${baseName} 对话文件自动拆解片段 ${index + 1}`),
    content: chunk,
    confidence: 0.62,
  }));
}

function splitConversationContent(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return ["空对话文件，已创建占位知识候选，请在审核时补充内容。"];

  const jsonChunks = splitJsonConversation(normalized);
  if (jsonChunks.length > 0) return jsonChunks.flatMap((chunk) => splitByLength(chunk, 1200));

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length >= 2) return groupTextBlocks(blocks, 3, 1200);

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length >= 8) return groupTextBlocks(lines, 8, 1200);

  return splitByLength(normalized, 1200);
}

function splitJsonConversation(text: string) {
  try {
    const parsed: unknown = JSON.parse(text);
    const records = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.messages)
        ? parsed.messages
        : isRecord(parsed) && Array.isArray(parsed.conversations)
          ? parsed.conversations
          : [parsed];
    return records.map(formatConversationRecord).filter(Boolean);
  } catch {
    return [];
  }
}

function formatConversationRecord(record: unknown): string {
  if (typeof record === "string") return record;
  if (!isRecord(record)) return String(record);

  if (Array.isArray(record.messages)) {
    return record.messages.map(formatConversationRecord).filter(Boolean).join("\n");
  }

  const role = pickString(record, ["role", "speaker", "name", "from", "sender"]) ?? "记录";
  const message =
    pickString(record, ["text", "content", "message", "question", "answer", "summary"]) ??
    JSON.stringify(record, null, 2);
  return `${role}：${message}`;
}

function groupTextBlocks(blocks: string[], maxBlocks: number, maxLength: number) {
  const groups: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  blocks.forEach((block) => {
    const nextLength = currentLength + block.length;
    if (current.length > 0 && (current.length >= maxBlocks || nextLength > maxLength)) {
      groups.push(current.join("\n\n"));
      current = [];
      currentLength = 0;
    }
    current.push(block);
    currentLength += block.length;
  });

  if (current.length > 0) groups.push(current.join("\n\n"));
  return groups;
}

function splitByLength(text: string, maxLength: number) {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += maxLength) {
    chunks.push(text.slice(start, start + maxLength).trim());
  }
  return chunks.filter(Boolean);
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function estimateUploadChunks(file: File) {
  const sizeBase = isPdfFile(file) ? 180_000 : 3_000;
  return Math.max(1, Math.min(10, Math.ceil(file.size / sizeBase)));
}

function cleanFileName(name: string) {
  return name.replace(/\.[^.]+$/, "") || "上传文件";
}

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function summarizeText(text: string, fallback: string) {
  const compact = normalizeText(text).replace(/\n/g, " ");
  return compact ? compact.slice(0, 96) : fallback;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function NewLibraryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (library: KnowledgeLibrary) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerDepartment, setOwnerDepartment] = useState("知识运营");
  const [scope, setScope] = useState("AI 客服 / 客服工作台");

  const submit = () => {
    if (!name.trim()) {
      toast.error("请填写知识库名称");
      return;
    }
    const library = addKnowledgeLibrary({
      name,
      description: description || "用于沉淀新业务场景的知识库。",
      ownerDepartment,
      scope,
    });
    setName("");
    setDescription("");
    setOwnerDepartment("知识运营");
    setScope("AI 客服 / 客服工作台");
    onCreated(library);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增知识库</DialogTitle>
          <DialogDescription>
            新知识库会出现在公共知识库列表中，后续可在库内继续新增知识条目。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="知识库名称">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="说明">
            <Textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="例如：面向某条产品线、区域市场或特殊售后场景的知识库"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="负责部门">
              <Input
                value={ownerDepartment}
                onChange={(event) => setOwnerDepartment(event.target.value)}
              />
            </Field>
            <Field label="权限范围">
              <Input value={scope} onChange={(event) => setScope(event.target.value)} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit}>创建知识库</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewKnowledgeDialog({
  open,
  onOpenChange,
  library,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  library?: KnowledgeLibrary;
  onCreated: (importedCount?: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadInputKey, setUploadInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const uploadStats = useMemo(() => summarizeUploadFiles(uploadFiles), [uploadFiles]);

  const clearUploads = () => {
    setUploadFiles([]);
    setUploadInputKey((key) => key + 1);
  };

  const resetForm = () => {
    setTitle("");
    setSummary("");
    setContent("");
    setTags("");
    clearUploads();
  };

  const submit = async () => {
    if (!library) {
      toast.error("请先选择知识库");
      return;
    }
    if (uploadFiles.length > 0) {
      setSubmitting(true);
      try {
        const entries = await buildEntriesFromUploadedFiles(uploadFiles, library);
        entries.forEach((entry) => addKnowledgeEntry(entry));
        resetForm();
        onCreated(entries.length);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error("请填写标题和正文");
      return;
    }
    addKnowledgeEntry({
      sourceIds: [`MANUAL-${Date.now().toString().slice(-6)}`],
      sourceType: "manual",
      sourceSystem: "后台手动新增",
      targetLibraryId: library.id,
      targetLibraryName: library.name,
      entryType: "qa",
      category: library.id,
      categoryName: library.name.replace(/知识库$/, ""),
      title: title.trim(),
      summary: summary.trim() || content.trim().slice(0, 80),
      content: content.trim(),
      tags: tags.trim() || library.name,
      initialConfidence: 0.8,
      confidence: 0.8,
      riskLevel: "低",
      dataLevel: "L1",
      caseSummary: summary.trim() || title.trim(),
      actions: "知识库管理员手动新增知识并提交审核。",
      result: "审核通过后进入正式知识库供 AI 客服检索。",
      reviewReason: "后台手动新增知识",
    });
    resetForm();
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新增知识</DialogTitle>
          <DialogDescription>
            当前目标知识库：{library?.name ?? "未选择"}。可手动录入，也可上传 PDF
            文件或对话文件自动拆解。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="知识文件上传">
            <div className="rounded-md border border-dashed bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm">
                <UploadCloud className="w-4 h-4 text-primary" />
                <span className="font-medium">文件上传自动拆解</span>
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">对话文件</Badge>
              </div>
              <Input
                key={uploadInputKey}
                type="file"
                multiple
                accept="application/pdf,.pdf,.txt,.json,.csv,.md,text/plain,application/json,text/csv,text/markdown"
                onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
              />
              {uploadFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      已选择 {uploadFiles.length} 个文件，预计拆解 {uploadStats.estimatedChunks}{" "}
                      条知识
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={clearUploads}
                    >
                      <X className="w-3 h-3" />
                      清空
                    </Button>
                  </div>
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {uploadFiles.map((file) => {
                      const pdf = isPdfFile(file);
                      const Icon = pdf ? FileText : MessagesSquare;
                      return (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-xs"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <div className="shrink-0 text-muted-foreground">
                            {pdf ? "PDF 文件" : "对话文件"} · {formatFileSize(file.size)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Field>
          <Field label="知识标题">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="摘要">
            <Textarea
              rows={3}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="一句话说明这条知识解决什么问题"
            />
          </Field>
          <Field label="正文内容">
            <Textarea
              rows={7}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="可填写标准答案、处理步骤、适用条件、注意事项和引用来源"
            />
          </Field>
          <Field label="标签">
            <Input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="用逗号分隔，例如：保修, 配件, 发货"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {uploadFiles.length > 0 ? "上传并拆解" : "提交审核"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
