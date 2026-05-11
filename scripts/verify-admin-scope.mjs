import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const checks = [
  {
    file: "src/lib/knowledge-store.ts",
    patterns: [
      "KnowledgeLibrary",
      "initialConfidence",
      "targetLibraryId",
      "caseSummary",
      "syncStatus",
      "产品使用知识库",
      "故障排查知识库",
      "订单物流查询知识库",
      "退换货问题知识库",
      "产品推荐知识库",
      "产品配件知识库",
      "政策说明知识库",
      "投诉处理知识库",
      "其他知识库",
      "addKnowledgeLibrary",
      "moveKnowledgeEntry",
      "deleteKnowledgeLibrary",
      "retryKnowledgeSync",
      "mergeKnowledgeEntry",
      "KnowledgeAuditLog",
    ],
  },
  {
    file: "src/routes/index.tsx",
    patterns: ["后台运营总览", "入库审核总览", "客服工作台对话", "ERP 工单"],
  },
  {
    file: "src/routes/knowledge.tsx",
    patterns: [
      "公共知识库",
      "知识库详情",
      "低置信度复核",
      "目标知识库",
      "新增知识库",
      "新增知识",
      "NewLibraryDialog",
      "NewKnowledgeDialog",
      "MoveKnowledgeDialog",
      "移动到其他知识库",
      "删除知识库",
      "文件上传自动拆解",
      "PDF 文件",
      "对话文件",
      "同步失败",
      "重试同步",
      "合并重复知识",
      "审计记录",
    ],
  },
  {
    file: "src/routes/sessions.tsx",
    patterns: [
      "客服工作台对话审核入库",
      "原始详细对话",
      "AI提炼结果",
      "具体 QA",
      "具体 SOP",
      "入库审核",
    ],
  },
  {
    file: "src/routes/tickets.tsx",
    patterns: ["ERP 工单审核入库", "原始工单详情", "AI提炼结果", "具体 QA", "具体 SOP", "入库审核"],
  },
  {
    file: "src/components/knowledge/EntryDetailDialog.tsx",
    patterns: [
      "Case",
      "Actions",
      "Result",
      "数据治理",
      "目标知识库",
      "原始详细对话",
      "AI 提炼结果",
      "具体 QA",
      "具体 SOP",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const text = fs.readFileSync(path.join(root, check.file), "utf8");
  for (const pattern of check.patterns) {
    if (!text.includes(pattern)) {
      failures.push(`${check.file} missing "${pattern}"`);
    }
  }
}

if (failures.length) {
  console.error("Admin scope verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Admin scope verification passed.");
