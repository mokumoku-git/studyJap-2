export const questions = [
  {
    id: "work-deadline",
    title: "向领导申请项目延期",
    scenario: "工作",
    role: "部下 → 上司",
    emotion: "紧张 / 抱歉",
    purpose: "延期申请",
    prompt: "项目快到截止日期了，但你觉得按当前进度很难完成。你想向领导申请延期，应该怎么说？",
    keywords: ["納期", "スケジュール", "調整"],
    patterns: ["申し訳ありませんが〜", "〜についてご相談があります", "〜させていただきたいです"],
    sampleInput: "この納期は無理です。延期したいです。"
  },
  {
    id: "nursery-delay",
    title: "向保育园老师说明会晚到",
    scenario: "保育园",
    role: "家长 → 老师",
    emotion: "抱歉",
    purpose: "解释原因",
    prompt: "电车延误，你可能会比平时晚一点去接孩子。请向保育园老师说明情况。",
    keywords: ["電車遅延", "お迎え", "少し遅れる"],
    patterns: ["ご迷惑をおかけします", "〜の影響で", "到着次第〜"],
    sampleInput: "電車が遅いので、迎えが遅れます。"
  },
  {
    id: "clinic-symptoms",
    title: "在医院说明症状",
    scenario: "医院",
    role: "患者 → 医生",
    emotion: "焦虑",
    purpose: "描述症状",
    prompt: "你最近头痛并且有点发烧。请向医生清楚说明症状和持续时间。",
    keywords: ["頭痛", "熱", "昨日から"],
    patterns: ["昨日から〜があります", "少し心配で", "診ていただけますか"],
    sampleInput: "頭が痛くて熱があります。"
  }
];

export function getQuestion(id) {
  return questions.find((question) => question.id === id) || questions[0];
}

export function getDailyQuestion() {
  return questions[0];
}
