import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, RefreshCw, Search, Trash2, ArrowDownToLine, Replace } from "lucide-react";

export const Route = createFileRoute("/knowledge")({ component: Page });

const categories = [
  { id: "product", name: "产品手册", count: 124 },
  { id: "return", name: "退换货政策", count: 56 },
  { id: "logistics", name: "物流配送", count: 78 },
  { id: "after", name: "售后服务", count: 92 },
  { id: "complaint", name: "投诉处理", count: 34 },
  { id: "tech", name: "技术支持", count: 67 },
];

const items = Array.from({ length: 10 }).map((_, i) => ({
  id: `K${20000 + i}`,
  title: ["如何申请退货？", "国际物流时效说明", "产品保修政策", "订单修改流程", "支付失败处理"][i % 5] + ` #${i + 1}`,
  type: ["知识", "FAQ", "工单记录"][i % 3],
  score: [88, 76, 25, 45, 92, 18, 67, 39, 81, 28][i],
  updated: `2026-04-${20 + (i % 9)}`,
}));

function Page() {
  const [active, setActive] = useState("product");
  return (
    <div>
      <PageHeader
        title="知识库管理"
        description="按类目管理知识、FAQ 与工单记录，置信度低于 30 分将提示替换或删除"
        actions={
          <>
            <Button variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" />同步至工作台</Button>
            <Button className="gap-2"><Plus className="w-4 h-4" />新增知识</Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-3 bg-card rounded-lg border shadow-[var(--shadow-card)] p-2 h-fit">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors ${
                active === c.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
              }`}
            >
              <span>{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.count}</span>
            </button>
          ))}
        </aside>
        <div className="col-span-9 bg-card rounded-lg border shadow-[var(--shadow-card)]">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索知识..." className="pl-9 h-9" />
            </div>
          </div>
          <Tabs defaultValue="all" className="px-4 pt-3">
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="knowledge">知识</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="ticket">工单记录</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>标题</TableHead><TableHead>类型</TableHead>
                    <TableHead>置信度</TableHead><TableHead>更新时间</TableHead><TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const low = it.score < 30;
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="font-mono text-xs">{it.id}</TableCell>
                        <TableCell className="font-medium">{it.title}</TableCell>
                        <TableCell><Badge variant="outline">{it.type}</Badge></TableCell>
                        <TableCell>
                          <span className={`font-medium ${low ? "text-destructive" : it.score < 60 ? "text-warning" : "text-success"}`}>{it.score}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{it.updated}</TableCell>
                        <TableCell className="text-right">
                          {low ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" className="h-8 gap-1"><Replace className="w-3 h-3" />替换</Button>
                              <Button size="sm" variant="outline" className="h-8 gap-1"><ArrowDownToLine className="w-3 h-3" />沉底</Button>
                              <Button size="sm" variant="ghost" className="h-8 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-8">查看</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="knowledge"><div className="py-12 text-center text-sm text-muted-foreground">仅显示知识类目</div></TabsContent>
            <TabsContent value="faq"><div className="py-12 text-center text-sm text-muted-foreground">仅显示 FAQ</div></TabsContent>
            <TabsContent value="ticket"><div className="py-12 text-center text-sm text-muted-foreground">仅显示工单记录</div></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}