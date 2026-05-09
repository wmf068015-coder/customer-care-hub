import { useSyncExternalStore } from "react";

export type ReviewStatus = "审核中" | "已通过" | "已驳回";
export type SourceType = "session" | "ticket";

export type KnowledgeEntry = {
  id: string; // entry id (knowledge id)
  sourceIds: string[]; // session/ticket ids
  sourceType: SourceType;
  category: string;
  categoryName: string;
  title: string;
  summary: string;
  content: string;
  tags: string;
  status: ReviewStatus;
  submittedAt: string;
  reviewedAt?: string;
};

let entries: KnowledgeEntry[] = [];
let seq = 90000;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => entries;

export function useKnowledgeStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addKnowledgeEntry(
  e: Omit<KnowledgeEntry, "id" | "status" | "submittedAt">,
) {
  const entry: KnowledgeEntry = {
    ...e,
    id: `K${++seq}`,
    status: "审核中",
    submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
  entries = [entry, ...entries];
  emit();
  return entry;
}

export function setEntryStatus(id: string, status: ReviewStatus) {
  entries = entries.map((e) =>
    e.id === id
      ? { ...e, status, reviewedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }
      : e,
  );
  emit();
}

/** Latest review status for a given source (session/ticket) id. */
export function statusForSource(
  sourceId: string,
  entries: KnowledgeEntry[],
): ReviewStatus | null {
  const order: ReviewStatus[] = ["已通过", "审核中", "已驳回"];
  const matched = entries.filter((e) => e.sourceIds.includes(sourceId));
  if (matched.length === 0) return null;
  for (const s of order) if (matched.some((m) => m.status === s)) return s;
  return null;
}

// ---- Seed mock incoming items from 客服工作台 / ERP 工单系统 ----
const cats = [
  { id: "product", name: "产品手册" },
  { id: "return", name: "退换货政策" },
  { id: "logistics", name: "物流配送" },
  { id: "after", name: "售后服务" },
  { id: "complaint", name: "投诉处理" },
  { id: "tech", name: "技术支持" },
];

const sessionSeeds = [
  { title: "退货后多久能收到退款？", summary: "用户咨询退货退款到账时效，客服明确 3-7 工作日。", cat: 1, channel: "桌面网站" },
  { title: "Shopify 订单地址如何修改？", summary: "客服指导用户在订单未发货前自助修改收货地址。", cat: 0, channel: "Shopify" },
  { title: "国际物流签收异常处理", summary: "包裹长时间未更新的排查与赔付流程。", cat: 2, channel: "移动网站" },
  { title: "优惠券叠加使用规则", summary: "满减券与折扣码的叠加限制与示例。", cat: 0, channel: "桌面网站" },
  { title: "保修期内产品故障申报", summary: "用户提交故障视频与序列号，客服走售后流程。", cat: 3, channel: "Shopify" },
];

const ticketSeeds = [
  { title: "重复扣款退回流程", summary: "ERP 工单：客户被扣两笔，需走原路退回。", cat: 1 },
  { title: "破损件理赔标准", summary: "ERP 工单：物流途中破损的赔付金额与举证。", cat: 4 },
  { title: "VIP 客户优先发货策略", summary: "ERP 工单：VIP 等级与发货优先级映射。", cat: 2 },
  { title: "App 闪退技术排查", summary: "ERP 工单：iOS 17 升级后部分机型闪退。", cat: 5 },
];

function ts(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

let seeded = false;
function seed() {
  if (seeded) return;
  seeded = true;
  const list: KnowledgeEntry[] = [];
  sessionSeeds.forEach((s, i) => {
    const c = cats[s.cat];
    list.push({
      id: `K${++seq}`,
      sourceIds: [`S${30100 + i}`],
      sourceType: "session",
      category: c.id,
      categoryName: c.name,
      title: s.title,
      summary: s.summary,
      content: s.summary,
      tags: c.name,
      status: i === 0 ? "已通过" : i === 1 ? "已驳回" : "审核中",
      submittedAt: ts(i + 1),
      reviewedAt: i < 2 ? ts(i) : undefined,
    });
  });
  ticketSeeds.forEach((t, i) => {
    const c = cats[t.cat];
    list.push({
      id: `K${++seq}`,
      sourceIds: [`TK-${6100 + i}`],
      sourceType: "ticket",
      category: c.id,
      categoryName: c.name,
      title: t.title,
      summary: t.summary,
      content: t.summary,
      tags: c.name,
      status: i === 0 ? "已通过" : i === 1 ? "已驳回" : "审核中",
      submittedAt: ts(i + 1),
      reviewedAt: i < 2 ? ts(i) : undefined,
    });
  });
  entries = [...list, ...entries];
}
seed();