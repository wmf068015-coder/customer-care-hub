import { useSyncExternalStore } from "react";

export type ReviewStatus = "审核中" | "已通过" | "已驳回";
export type SourceType = "session" | "ticket";

export type DialogMessage = {
  role: "user" | "agent" | "bot" | "system";
  name: string;
  time: string;
  text: string;
};

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
  submitter?: string;
  conversationAt?: string;
  messages?: DialogMessage[];
  // Ticket-specific extra fields
  ticketType?: string;
  productCategory?: string;
  productModel?: string;
  applicant?: string; // 提单人
  handler?: string;   // 处理人
  attachments?: { name: string; size: string }[];
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
  { title: "退货后多久能收到退款？", summary: "用户咨询退货退款到账时效，客服明确 3-7 工作日。", cat: 1, channel: "桌面网站", submitter: "客服 · 林小雨", customer: "Emily W.", q: "我上周退的货，钱什么时候能到账？", a: "您好，退款会在我们收到包裹后 1-2 个工作日内原路退回，到账时间约 3-7 个工作日，具体取决于发卡行。" },
  { title: "Shopify 订单地址如何修改？", summary: "客服指导用户在订单未发货前自助修改收货地址。", cat: 0, channel: "Shopify", submitter: "客服 · 张磊", customer: "John D.", q: "我刚下的单地址写错了，怎么改？", a: "未发货状态下您可在订单详情页点击「编辑地址」自助修改；如已发货请联系我们尝试拦截。" },
  { title: "国际物流签收异常处理", summary: "包裹长时间未更新的排查与赔付流程。", cat: 2, channel: "移动网站", submitter: "客服 · 王悦", customer: "Sophia L.", q: "我的包裹一周没更新物流了，是不是丢了？", a: "已为您发起物流查询工单，若 5 个工作日内仍无更新，我们将按丢件流程为您补发或全额退款。" },
  { title: "优惠券叠加使用规则", summary: "满减券与折扣码的叠加限制与示例。", cat: 0, channel: "桌面网站", submitter: "客服 · 陈昊", customer: "Mike R.", q: "为什么我的折扣码用不了？", a: "满减券与折扣码不可叠加使用，建议您选择优惠力度更大的一种。" },
  { title: "保修期内产品故障申报", summary: "用户提交故障视频与序列号，客服走售后流程。", cat: 3, channel: "Shopify", submitter: "客服 · 李娜", customer: "Anna K.", q: "产品用了两个月就不开机了，能保修吗？", a: "在 12 个月保修期内，请提供故障视频与机身序列号，我们将为您安排免费维修或换新。" },
];

const ticketSeeds = [
  { title: "重复扣款退回流程", summary: "ERP 工单：客户被扣两笔，需走原路退回。", cat: 1, submitter: "ERP · 财务工单", customer: "客户 #88231", q: "同一笔订单被扣了两次款，请处理。", a: "已核实重复扣款，多扣金额将于 1-3 个工作日内原路退回您的支付账户。" },
  { title: "破损件理赔标准", summary: "ERP 工单：物流途中破损的赔付金额与举证。", cat: 4, submitter: "ERP · 售后工单", customer: "客户 #91002", q: "收到的产品外壳破损了，怎么赔？", a: "请提供开箱视频与破损照片，核实后按商品价值的 30%-100% 进行赔付或安排换新。" },
  { title: "VIP 客户优先发货策略", summary: "ERP 工单：VIP 等级与发货优先级映射。", cat: 2, submitter: "ERP · 物流工单", customer: "VIP #V0421", q: "我是 VIP 用户，发货能快一点吗？", a: "V3 及以上 VIP 享 24 小时优先出库，已为您加急处理本笔订单。" },
  { title: "App 闪退技术排查", summary: "ERP 工单：iOS 17 升级后部分机型闪退。", cat: 5, submitter: "ERP · 技术工单", customer: "客户 #76310", q: "升级 iOS 17 后 App 一打开就闪退。", a: "已定位为兼容性问题，请升级到最新版 v3.2.1，或临时使用网页版访问。" },
];

// Deterministic timestamps to avoid SSR/CSR hydration mismatch
function ts(daysAgo: number) {
  const base = new Date("2026-05-09T10:00:00Z");
  base.setUTCDate(base.getUTCDate() - daysAgo);
  return base.toISOString().slice(0, 16).replace("T", " ");
}

const ticketExtras = [
  { ticketType: "退款工单", productCategory: "智能音箱", productModel: "SoundOne Pro", applicant: "客户 #88231", handler: "财务 · 周敏", attachments: [{ name: "重复扣款流水.pdf", size: "128 KB" }, { name: "订单截图.png", size: "342 KB" }] },
  { ticketType: "理赔工单", productCategory: "智能手表", productModel: "WatchX 2", applicant: "客户 #91002", handler: "售后 · 何洁", attachments: [{ name: "开箱视频.mp4", size: "8.6 MB" }, { name: "破损照片.jpg", size: "1.2 MB" }] },
  { ticketType: "物流加急", productCategory: "无线耳机", productModel: "AirBuds 3", applicant: "VIP #V0421", handler: "物流 · 赵宇", attachments: [{ name: "VIP 凭证.png", size: "210 KB" }] },
  { ticketType: "技术工单", productCategory: "移动 App", productModel: "iOS v3.2.0", applicant: "客户 #76310", handler: "技术 · 钱伟", attachments: [{ name: "崩溃日志.txt", size: "44 KB" }] },
];

let seeded = false;
function seed() {
  if (seeded) return;
  seeded = true;
  const list: KnowledgeEntry[] = [];
  sessionSeeds.forEach((s, i) => {
    const c = cats[s.cat];
    const convAt = ts(i + 2);
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
      submitter: s.submitter,
      conversationAt: convAt,
      messages: [
        { role: "user", name: s.customer, time: convAt, text: s.q },
        { role: "bot", name: "AI 客服", time: convAt, text: "正在为您查询，请稍候…" },
        { role: "agent", name: s.submitter.replace(/^客服 · /, ""), time: convAt, text: s.a },
        { role: "user", name: s.customer, time: convAt, text: "好的，明白了，谢谢！" },
      ],
    });
  });
  ticketSeeds.forEach((t, i) => {
    const c = cats[t.cat];
    const convAt = ts(i + 2);
    const ex = ticketExtras[i];
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
      submitter: t.submitter,
      conversationAt: convAt,
      ticketType: ex?.ticketType,
      productCategory: ex?.productCategory,
      productModel: ex?.productModel,
      applicant: ex?.applicant,
      handler: ex?.handler,
      attachments: ex?.attachments,
      messages: [
        { role: "system", name: "ERP", time: convAt, text: `工单已创建：${t.title}` },
        { role: "user", name: t.customer, time: convAt, text: t.q },
        { role: "agent", name: "工单处理人", time: convAt, text: t.a },
      ],
    });
  });
  entries = [...list, ...entries];
}
seed();