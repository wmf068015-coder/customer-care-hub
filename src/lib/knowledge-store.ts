import { useSyncExternalStore } from "react";

export type ReviewStatus = "审核中" | "已通过" | "已驳回";
export type SourceType = "session" | "ticket" | "manual" | "file";
export type EntryKind = "qa" | "session_case" | "ticket_case" | "file";
export type RiskLevel = "低" | "中" | "高";
export type DataLevel = "L1" | "L2" | "L3" | "L4";
export type SyncStatus = "待处理" | "待审核" | "已生效" | "已驳回" | "同步失败";

export type KnowledgeLibrary = {
  id: string;
  name: string;
  description: string;
  ownerDepartment: string;
  scope: string;
  entryKinds: EntryKind[];
  baseEntryCount: number;
  baseEffectiveCount: number;
  total: number;
  effective: number;
  pending: number;
  lowConfidence: number;
  updatedAt: string;
};

export type NewKnowledgeLibrary = {
  name: string;
  description: string;
  ownerDepartment: string;
  scope: string;
  entryKinds?: EntryKind[];
};

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
  sourceSystem: string;
  targetLibraryId: string;
  targetLibraryName: string;
  entryType: EntryKind;
  category: string;
  categoryName: string;
  title: string;
  summary: string;
  content: string;
  tags: string;
  status: ReviewStatus;
  syncStatus: SyncStatus;
  initialConfidence: number;
  confidence: number;
  riskLevel: RiskLevel;
  dataLevel: DataLevel;
  submittedAt: string;
  reviewedAt?: string;
  submitter?: string;
  conversationAt?: string;
  sceneId?: string;
  caseSummary?: string;
  actions?: string;
  result?: string;
  question?: string;
  answer?: string;
  language?: string;
  channel?: string;
  reviewReason?: string;
  duplicateHint?: string;
  slaDueAt?: string;
  messages?: DialogMessage[];
  // Ticket-specific extra fields
  ticketType?: string;
  productCategory?: string;
  productModel?: string;
  applicant?: string; // 提单人
  handler?: string; // 处理人
  attachments?: { name: string; size: string }[];
};

export type NewKnowledgeEntry = {
  sourceIds: string[];
  sourceType: SourceType;
  category: string;
  categoryName: string;
  title: string;
  summary: string;
  content: string;
  tags: string;
  sourceSystem?: string;
  targetLibraryId?: string;
  targetLibraryName?: string;
  entryType?: EntryKind;
  syncStatus?: SyncStatus;
  initialConfidence?: number;
  confidence?: number;
  riskLevel?: RiskLevel;
  dataLevel?: DataLevel;
  submitter?: string;
  conversationAt?: string;
  sceneId?: string;
  caseSummary?: string;
  actions?: string;
  result?: string;
  question?: string;
  answer?: string;
  language?: string;
  channel?: string;
  reviewReason?: string;
  duplicateHint?: string;
  slaDueAt?: string;
  messages?: DialogMessage[];
  ticketType?: string;
  productCategory?: string;
  productModel?: string;
  applicant?: string;
  handler?: string;
  attachments?: { name: string; size: string }[];
};

let entries: KnowledgeEntry[] = [];
let seq = 90000;
let librarySeq = 1000;
let customLibraries: Omit<KnowledgeLibrary, "total" | "effective" | "pending" | "lowConfidence">[] =
  [];
let deletedLibraryIds = new Set<string>();
let librarySnapshot: KnowledgeLibrary[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  librarySnapshot = summarizeLibraries();
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => entries;
const getLibrarySnapshot = () => librarySnapshot;

export function useKnowledgeStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useKnowledgeLibraries() {
  return useSyncExternalStore(subscribe, getLibrarySnapshot, getLibrarySnapshot);
}

export function addKnowledgeEntry(e: NewKnowledgeEntry) {
  const targetLibraryId = e.targetLibraryId ?? defaultLibraryForSource(e.sourceType);
  const targetLibraryName = e.targetLibraryName ?? libraryName(targetLibraryId);
  const initialConfidence = e.initialConfidence ?? defaultConfidenceForSource(e.sourceType);
  const entry: KnowledgeEntry = {
    ...e,
    id: `K${++seq}`,
    sourceSystem: e.sourceSystem ?? sourceSystemForType(e.sourceType),
    targetLibraryId,
    targetLibraryName,
    entryType: e.entryType ?? entryKindForSource(e.sourceType),
    status: "审核中",
    syncStatus: "待审核",
    initialConfidence,
    confidence: e.confidence ?? initialConfidence,
    riskLevel: e.riskLevel ?? "中",
    dataLevel: e.dataLevel ?? "L1",
    submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
  entries = [entry, ...entries];
  emit();
  return entry;
}

export function addKnowledgeLibrary(library: NewKnowledgeLibrary) {
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const item: Omit<KnowledgeLibrary, "total" | "effective" | "pending" | "lowConfidence"> = {
    id: `kb-custom-${++librarySeq}`,
    name: library.name.trim(),
    description: library.description.trim(),
    ownerDepartment: library.ownerDepartment.trim() || "知识运营",
    scope: library.scope.trim() || "AI 客服 / 客服工作台",
    entryKinds: library.entryKinds ?? ["qa", "file"],
    baseEntryCount: 0,
    baseEffectiveCount: 0,
    updatedAt: now,
  };
  customLibraries = [item, ...customLibraries];
  emit();
  return {
    ...item,
    total: 0,
    effective: 0,
    pending: 0,
    lowConfidence: 0,
  };
}

export function moveKnowledgeEntry(id: string, targetLibraryId: string) {
  const targetLibraryName = libraryName(targetLibraryId);
  entries = entries.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          targetLibraryId,
          targetLibraryName,
          category: targetLibraryId,
          categoryName: targetLibraryName.replace(/知识库$/, ""),
        }
      : entry,
  );
  emit();
  return entries.find((entry) => entry.id === id);
}

export function deleteKnowledgeLibrary(id: string, fallbackLibraryId?: string) {
  const candidates = allLibraryBases().filter((library) => library.id !== id);
  if (candidates.length === 0) return null;

  const fallback =
    candidates.find((library) => library.id === fallbackLibraryId) ??
    candidates.find((library) => library.id === "kb-other") ??
    candidates[0];

  entries = entries.map((entry) =>
    entry.targetLibraryId === id
      ? {
          ...entry,
          targetLibraryId: fallback.id,
          targetLibraryName: fallback.name,
          category: fallback.id,
          categoryName: fallback.name.replace(/知识库$/, ""),
          reviewReason: `${entry.reviewReason ?? "知识库调整"}；原知识库已删除，自动迁移至${fallback.name}`,
        }
      : entry,
  );

  customLibraries = customLibraries.filter((library) => library.id !== id);
  deletedLibraryIds = new Set([...deletedLibraryIds, id]);
  emit();
  return {
    ...fallback,
    total:
      entries.filter((entry) => entry.targetLibraryId === fallback.id).length +
      fallback.baseEntryCount,
    effective:
      entries.filter((entry) => entry.targetLibraryId === fallback.id && entry.status === "已通过")
        .length + fallback.baseEffectiveCount,
    pending: entries.filter(
      (entry) => entry.targetLibraryId === fallback.id && entry.status === "审核中",
    ).length,
    lowConfidence: entries.filter(
      (entry) =>
        entry.targetLibraryId === fallback.id &&
        (entry.confidence < 0.3 || entry.reviewReason?.includes("低置信度")),
    ).length,
  };
}

export function setEntryStatus(id: string, status: ReviewStatus) {
  entries = entries.map((e) =>
    e.id === id
      ? {
          ...e,
          status,
          syncStatus: status === "已通过" ? "已生效" : status === "已驳回" ? "已驳回" : "待审核",
          reviewedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        }
      : e,
  );
  emit();
}

/** Latest review status for a given source (session/ticket) id. */
export function statusForSource(sourceId: string, entries: KnowledgeEntry[]): ReviewStatus | null {
  const order: ReviewStatus[] = ["已通过", "审核中", "已驳回"];
  const matched = entries.filter((e) => e.sourceIds.includes(sourceId));
  if (matched.length === 0) return null;
  for (const s of order) if (matched.some((m) => m.status === s)) return s;
  return null;
}

// ---- Seed mock incoming items from 客服工作台 / ERP 工单系统 ----
const cats = [
  { id: "product_usage", name: "产品使用" },
  { id: "troubleshooting", name: "故障排查" },
  { id: "order_logistics", name: "订单物流查询" },
  { id: "return_exchange", name: "退换货问题" },
  { id: "recommendation", name: "产品推荐" },
  { id: "accessories", name: "产品配件" },
  { id: "policy", name: "政策说明" },
  { id: "complaint", name: "投诉处理" },
  { id: "other", name: "其他" },
];

const libraryBases: Omit<KnowledgeLibrary, "total" | "effective" | "pending" | "lowConfidence">[] =
  [
    {
      id: "kb-product-usage",
      name: "产品使用知识库",
      description: "管理产品的图文信息、使用说明、规格参数、说明书摘要和常见操作步骤。",
      ownerDepartment: "产品 / 内容运营",
      scope: "客服 Agent / 人工客服",
      entryKinds: ["file", "qa", "session_case"],
      baseEntryCount: 186,
      baseEffectiveCount: 178,
      updatedAt: "2026-05-08 18:30",
    },
    {
      id: "kb-troubleshooting",
      name: "故障排查知识库",
      description: "沉淀过往故障处理数据、ERP 售后工单、排查步骤、附件证据和最终解决方案。",
      ownerDepartment: "售后 / 技术支持",
      scope: "客服 Agent / 售后团队",
      entryKinds: ["ticket_case", "session_case", "qa"],
      baseEntryCount: 124,
      baseEffectiveCount: 116,
      updatedAt: "2026-05-08 17:10",
    },
    {
      id: "kb-order-logistics",
      name: "订单物流查询知识库",
      description: "维护订单查询、发货时效、物流异常、签收异常、加急出库和 Shopify/ERP 查询话术。",
      ownerDepartment: "客服 / 物流",
      scope: "AI 客服 / 物流客服",
      entryKinds: ["session_case", "ticket_case", "qa"],
      baseEntryCount: 152,
      baseEffectiveCount: 145,
      updatedAt: "2026-05-08 16:45",
    },
    {
      id: "kb-return-exchange",
      name: "退换货问题知识库",
      description: "管理退货、换货、退款、保修、补发、破损举证和退货标签等售后政策与处理流程。",
      ownerDepartment: "客服 / 售后",
      scope: "AI 客服 / 售后客服",
      entryKinds: ["session_case", "ticket_case", "qa"],
      baseEntryCount: 138,
      baseEffectiveCount: 131,
      updatedAt: "2026-05-08 15:20",
    },
    {
      id: "kb-recommendation",
      name: "产品推荐知识库",
      description: "维护按场景、预算、设备兼容性和用户需求进行产品推荐的导购知识。",
      ownerDepartment: "产品 / 运营",
      scope: "客服 Agent / 产品团队",
      entryKinds: ["qa", "file"],
      baseEntryCount: 76,
      baseEffectiveCount: 72,
      updatedAt: "2026-05-08 14:30",
    },
    {
      id: "kb-accessories",
      name: "产品配件知识库",
      description: "管理配件兼容关系、替换件、安装方式、包装清单和缺件处理知识。",
      ownerDepartment: "产品 / 供应链",
      scope: "AI 客服 / 售后客服",
      entryKinds: ["file", "qa", "ticket_case"],
      baseEntryCount: 84,
      baseEffectiveCount: 79,
      updatedAt: "2026-05-08 13:40",
    },
    {
      id: "kb-policy",
      name: "政策说明知识库",
      description: "维护优惠、保修、会员、支付、价格保护、隐私和平台规则类说明。",
      ownerDepartment: "客服运营",
      scope: "AI 客服 / 客服工作台",
      entryKinds: ["qa", "session_case"],
      baseEntryCount: 112,
      baseEffectiveCount: 106,
      updatedAt: "2026-05-08 12:20",
    },
    {
      id: "kb-complaint",
      name: "投诉处理知识库",
      description: "沉淀投诉升级、安抚话术、赔付边界、负面情绪识别和回访流程。",
      ownerDepartment: "客服主管 / 售后",
      scope: "人工客服 / 客服主管",
      entryKinds: ["session_case", "ticket_case", "qa"],
      baseEntryCount: 58,
      baseEffectiveCount: 52,
      updatedAt: "2026-05-08 11:10",
    },
    {
      id: "kb-other",
      name: "其他知识库",
      description: "承接暂未归类、临时沉淀或待迁移归档的知识。",
      ownerDepartment: "知识运营",
      scope: "知识库管理员",
      entryKinds: ["qa", "file", "session_case", "ticket_case"],
      baseEntryCount: 19,
      baseEffectiveCount: 15,
      updatedAt: "2026-05-08 10:00",
    },
  ];

const sessionSeeds = [
  {
    title: "退货后多久能收到退款？",
    summary: "用户咨询退货退款到账时效，客服明确 3-7 工作日。",
    cat: 3,
    channel: "桌面网站",
    submitter: "客服 · 林小雨",
    customer: "Emily W.",
    q: "我上周退的货，钱什么时候能到账？",
    a: "您好，退款会在我们收到包裹后 1-2 个工作日内原路退回，到账时间约 3-7 个工作日，具体取决于发卡行。",
    scene: "退款时效解释",
    actions: "核对退货签收状态；说明仓库验收和支付渠道到账时差；补充发卡行影响。",
    result: "客户理解退款时间，未升级工单。",
  },
  {
    title: "Shopify 订单地址如何修改？",
    summary: "客服指导用户在订单未发货前自助修改收货地址。",
    cat: 2,
    channel: "Shopify",
    submitter: "客服 · 张磊",
    customer: "John D.",
    q: "我刚下的单地址写错了，怎么改？",
    a: "未发货状态下您可在订单详情页点击「编辑地址」自助修改；如已发货请联系我们尝试拦截。",
    scene: "订单未发货改地址",
    actions: "确认订单状态；指导用户自助编辑；已发货则提示走拦截。",
    result: "形成改地址 SOP 候选。",
  },
  {
    title: "国际物流签收异常处理",
    summary: "包裹长时间未更新的排查与赔付流程。",
    cat: 2,
    channel: "移动网站",
    submitter: "客服 · 王悦",
    customer: "Sophia L.",
    q: "我的包裹一周没更新物流了，是不是丢了？",
    a: "已为您发起物流查询工单，若 5 个工作日内仍无更新，我们将按丢件流程为您补发或全额退款。",
    scene: "物流长时间无更新",
    actions: "记录物流单号；发起物流查询；告知 5 个工作日处理节点。",
    result: "客户接受等待，需保留为物流异常处理模板。",
  },
  {
    title: "优惠券叠加使用规则",
    summary: "满减券与折扣码的叠加限制与示例。",
    cat: 6,
    channel: "桌面网站",
    submitter: "客服 · 陈昊",
    customer: "Mike R.",
    q: "为什么我的折扣码用不了？",
    a: "满减券与折扣码不可叠加使用，建议您选择优惠力度更大的一种。",
    scene: "优惠叠加失败解释",
    actions: "识别优惠券类型；解释叠加限制；建议选择最优折扣。",
    result: "适合进入标准 QA。",
  },
  {
    title: "保修期内产品故障申报",
    summary: "用户提交故障视频与序列号，客服走售后流程。",
    cat: 1,
    channel: "Shopify",
    submitter: "客服 · 李娜",
    customer: "Anna K.",
    q: "产品用了两个月就不开机了，能保修吗？",
    a: "在 12 个月保修期内，请提供故障视频与机身序列号，我们将为您安排免费维修或换新。",
    scene: "保修期内故障申报",
    actions: "确认购买时间；收集故障视频和序列号；进入售后保修流程。",
    result: "需要审核后同步给 AI 客服作为保修话术。",
  },
];

const ticketSeeds = [
  {
    title: "重复扣款退回流程",
    summary: "ERP 工单：客户被扣两笔，需走原路退回。",
    cat: 3,
    submitter: "ERP · 财务工单",
    customer: "客户 #88231",
    q: "同一笔订单被扣了两次款，请处理。",
    a: "已核实重复扣款，多扣金额将于 1-3 个工作日内原路退回您的支付账户。",
    scene: "重复扣款核实与退款",
    actions: "核对支付流水；标记重复扣款；财务发起原路退款。",
    result: "工单已关闭，结论可复用为退款 SOP。",
  },
  {
    title: "破损件理赔标准",
    summary: "ERP 工单：物流途中破损的赔付金额与举证。",
    cat: 7,
    submitter: "ERP · 售后工单",
    customer: "客户 #91002",
    q: "收到的产品外壳破损了，怎么赔？",
    a: "请提供开箱视频与破损照片，核实后按商品价值的 30%-100% 进行赔付或安排换新。",
    scene: "物流破损理赔",
    actions: "收集开箱视频和照片；售后评估损坏等级；选择赔付或换新。",
    result: "需要人工审核赔付比例，风险中等。",
  },
  {
    title: "VIP 客户优先发货策略",
    summary: "ERP 工单：VIP 等级与发货优先级映射。",
    cat: 2,
    submitter: "ERP · 物流工单",
    customer: "VIP #V0421",
    q: "我是 VIP 用户，发货能快一点吗？",
    a: "V3 及以上 VIP 享 24 小时优先出库，已为您加急处理本笔订单。",
    scene: "VIP 发货加急",
    actions: "确认会员等级；写入加急标签；同步仓库优先出库。",
    result: "适合进入物流策略知识库。",
  },
  {
    title: "App 闪退技术排查",
    summary: "ERP 工单：iOS 17 升级后部分机型闪退。",
    cat: 1,
    submitter: "ERP · 技术工单",
    customer: "客户 #76310",
    q: "升级 iOS 17 后 App 一打开就闪退。",
    a: "已定位为兼容性问题，请升级到最新版 v3.2.1，或临时使用网页版访问。",
    scene: "App 兼容性故障",
    actions: "收集崩溃日志；技术定位版本兼容；推荐升级或临时网页版。",
    result: "可作为技术支持 QA，需附版本范围。",
  },
];

// Deterministic timestamps to avoid SSR/CSR hydration mismatch
function ts(daysAgo: number) {
  const base = new Date("2026-05-09T10:00:00Z");
  base.setUTCDate(base.getUTCDate() - daysAgo);
  return base.toISOString().slice(0, 16).replace("T", " ");
}

const ticketExtras = [
  {
    ticketType: "退款工单",
    productCategory: "智能音箱",
    productModel: "SoundOne Pro",
    applicant: "客户 #88231",
    handler: "财务 · 周敏",
    attachments: [
      { name: "重复扣款流水.pdf", size: "128 KB" },
      { name: "订单截图.png", size: "342 KB" },
    ],
  },
  {
    ticketType: "理赔工单",
    productCategory: "智能手表",
    productModel: "WatchX 2",
    applicant: "客户 #91002",
    handler: "售后 · 何洁",
    attachments: [
      { name: "开箱视频.mp4", size: "8.6 MB" },
      { name: "破损照片.jpg", size: "1.2 MB" },
    ],
  },
  {
    ticketType: "物流加急",
    productCategory: "无线耳机",
    productModel: "AirBuds 3",
    applicant: "VIP #V0421",
    handler: "物流 · 赵宇",
    attachments: [{ name: "VIP 凭证.png", size: "210 KB" }],
  },
  {
    ticketType: "技术工单",
    productCategory: "移动 App",
    productModel: "iOS v3.2.0",
    applicant: "客户 #76310",
    handler: "技术 · 钱伟",
    attachments: [{ name: "崩溃日志.txt", size: "44 KB" }],
  },
];

const manualSeeds = [
  {
    title: "MC60 麦克风固件升级步骤",
    summary: "旧版文档与新版固件入口不一致，命中后需低置信度复核。",
    cat: 1,
    library: "kb-troubleshooting",
    sourceSystem: "ERP 文件同步",
    sourceType: "file" as const,
    confidence: 0.18,
    sourceId: "ERP-FILE-8832",
    reviewReason: "引用反馈 3 次拒绝，疑似版本过期",
  },
  {
    title: "退货标签补发话术",
    summary: "人工客服整理的退货标签邮件补发标准回复。",
    cat: 3,
    library: "kb-return-exchange",
    sourceSystem: "手动维护",
    sourceType: "manual" as const,
    confidence: 0.82,
    sourceId: "MANUAL-2109",
    reviewReason: "运营手动录入",
  },
];

function summarizeLibraries(): KnowledgeLibrary[] {
  return allLibraryBases().map((lib) => {
    const owned = entries.filter((e) => e.targetLibraryId === lib.id);
    const effective = owned.filter((e) => e.status === "已通过").length;
    const pending = owned.filter((e) => e.status === "审核中").length;
    const lowConfidence = owned.filter(
      (e) => e.confidence < 0.3 || e.reviewReason?.includes("低置信度"),
    ).length;
    return {
      ...lib,
      total: lib.baseEntryCount + owned.length,
      effective: lib.baseEffectiveCount + effective,
      pending,
      lowConfidence,
    };
  });
}

export function getLibraryName(id: string) {
  return libraryName(id);
}

function libraryName(id: string) {
  return allLibraryBases().find((l) => l.id === id)?.name ?? "其他知识库";
}

function defaultLibraryForSource(sourceType: SourceType) {
  if (sourceType === "ticket") return "kb-troubleshooting";
  if (sourceType === "file") return "kb-product-usage";
  if (sourceType === "manual") return "kb-other";
  return "kb-other";
}

function defaultConfidenceForSource(sourceType: SourceType) {
  if (sourceType === "ticket") return 0.7;
  if (sourceType === "file") return 0.5;
  if (sourceType === "manual") return 0.8;
  return 0.6;
}

function sourceSystemForType(sourceType: SourceType) {
  if (sourceType === "ticket") return "ERP 工单系统";
  if (sourceType === "file") return "ERP 文件同步";
  if (sourceType === "manual") return "后台手动维护";
  return "客服工作台";
}

function entryKindForSource(sourceType: SourceType): EntryKind {
  if (sourceType === "ticket") return "ticket_case";
  if (sourceType === "file") return "file";
  if (sourceType === "manual") return "qa";
  return "session_case";
}

function allLibraryBases() {
  return [...customLibraries, ...libraryBases].filter(
    (library) => !deletedLibraryIds.has(library.id),
  );
}

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
      sourceSystem: "客服工作台",
      targetLibraryId:
        i === 0
          ? "kb-return-exchange"
          : i === 1 || i === 2
            ? "kb-order-logistics"
            : i === 3
              ? "kb-policy"
              : "kb-troubleshooting",
      targetLibraryName: libraryName(
        i === 0
          ? "kb-return-exchange"
          : i === 1 || i === 2
            ? "kb-order-logistics"
            : i === 3
              ? "kb-policy"
              : "kb-troubleshooting",
      ),
      entryType: i === 3 ? "qa" : "session_case",
      category: c.id,
      categoryName: c.name,
      title: s.title,
      summary: s.summary,
      content: s.summary,
      tags: c.name,
      status: i === 0 ? "已通过" : i === 1 ? "已驳回" : "审核中",
      syncStatus: i === 0 ? "已生效" : i === 1 ? "已驳回" : "待审核",
      initialConfidence: 0.6,
      confidence: i === 4 ? 0.42 : 0.6,
      riskLevel: i === 2 || i === 4 ? "中" : "低",
      dataLevel: "L1",
      submittedAt: ts(i + 1),
      reviewedAt: i < 2 ? ts(i) : undefined,
      submitter: s.submitter,
      conversationAt: convAt,
      sceneId: `scene-session-${30100 + i}-01`,
      caseSummary: s.scene,
      actions: s.actions,
      result: s.result,
      question: s.q,
      answer: s.a,
      language: i === 0 ? "英文客户 / 中文沉淀" : "中文",
      channel: s.channel,
      reviewReason: i === 0 ? "客服标记为可复用 SOP" : "客服工作台推送候选知识",
      duplicateHint: i === 1 ? "疑似与「订单地址修改规则」重复，需确认合并" : undefined,
      slaDueAt: ts(i - 1),
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
      sourceSystem: "ERP 工单系统",
      targetLibraryId:
        i === 0 ? "kb-return-exchange" : i === 2 ? "kb-order-logistics" : "kb-troubleshooting",
      targetLibraryName: libraryName(
        i === 0 ? "kb-return-exchange" : i === 2 ? "kb-order-logistics" : "kb-troubleshooting",
      ),
      entryType: "ticket_case",
      category: c.id,
      categoryName: c.name,
      title: t.title,
      summary: t.summary,
      content: t.summary,
      tags: c.name,
      status: i === 0 ? "已通过" : i === 1 ? "已驳回" : "审核中",
      syncStatus: i === 0 ? "已生效" : i === 1 ? "已驳回" : "待审核",
      initialConfidence: 0.7,
      confidence: i === 3 ? 0.52 : 0.7,
      riskLevel: i === 1 ? "高" : "中",
      dataLevel: i === 1 ? "L2" : "L1",
      submittedAt: ts(i + 1),
      reviewedAt: i < 2 ? ts(i) : undefined,
      submitter: t.submitter,
      conversationAt: convAt,
      sceneId: `scene_ticket_${6100 + i}_01`,
      caseSummary: t.scene,
      actions: t.actions,
      result: t.result,
      question: t.q,
      answer: t.a,
      language: "中文",
      channel: "ERP",
      reviewReason: i === 0 ? "ERP 工单已关闭并由处理人确认" : "ERP 工单回传候选知识",
      duplicateHint: i === 2 ? "与物流政策库存在相近规则，建议保留较新版本" : undefined,
      slaDueAt: ts(i - 1),
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
  manualSeeds.forEach((m, i) => {
    const c = cats[m.cat];
    list.push({
      id: `K${++seq}`,
      sourceIds: [m.sourceId],
      sourceType: m.sourceType,
      sourceSystem: m.sourceSystem,
      targetLibraryId: m.library,
      targetLibraryName: libraryName(m.library),
      entryType: m.sourceType === "file" ? "file" : "qa",
      category: c.id,
      categoryName: c.name,
      title: m.title,
      summary: m.summary,
      content: m.summary,
      tags: c.name,
      status: "已通过",
      syncStatus: "已生效",
      initialConfidence: m.sourceType === "file" ? 0.5 : 0.8,
      confidence: m.confidence,
      riskLevel: m.confidence < 0.3 ? "高" : "低",
      dataLevel: m.confidence < 0.3 ? "L2" : "L1",
      submittedAt: ts(i + 4),
      reviewedAt: ts(i + 3),
      submitter: m.sourceSystem,
      conversationAt: ts(i + 4),
      sceneId: m.sourceType === "file" ? `file_section_${i + 1}` : `manual_qa_${i + 1}`,
      caseSummary: m.summary,
      actions:
        m.sourceType === "file" ? "系统解析 ERP 文件并生成摘要。" : "知识运营手动维护标准答案。",
      result: m.confidence < 0.3 ? "进入低置信度复核队列。" : "已发布至正式知识库。",
      reviewReason: m.reviewReason,
      slaDueAt: ts(i + 1),
    });
  });
  entries = [...list, ...entries];
  librarySnapshot = summarizeLibraries();
}
seed();
