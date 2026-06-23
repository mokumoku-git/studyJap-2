export function buildAnalysisPrompt(question, userInput) {
  return `
你是一个面向在日华人的日语沟通教练。

请分析用户在真实场景中的日语表达，重点不是考试语法，而是日本社会中更自然、更安全、更容易被对方接受的表达。

场景：${question.scenario}
身份：${question.role}
情绪：${question.emotion}
沟通目的：${question.purpose}
题目：${question.prompt}
关键词：${question.keywords.join("、")}
句型提示：${question.patterns.join(" / ")}

用户表达：
${userInput.trim() || question.sampleInput}

请只返回 JSON，字段如下：
{
  "corrected": "修正版，修正明显语法和措辞问题",
  "safe": "安全牌，正确且不会出错的表达",
  "better": "加分牌，更符合日本职场或生活沟通习惯的表达",
  "native": "地道牌，日本人日常更可能使用的自然表达",
  "thinking": "日本式思维解析，用中文解释为什么这样说，以及直接翻译中文为什么奇怪"
}
`.trim();
}

const OPENAI_API_KEY_STORAGE_KEY = "studyjap.openaiApiKey.v1";
const RUN_MODE_STORAGE_KEY = "studyjap.runMode.v1";
export const RUN_MODES = {
  DEMO: "demo",
  LOCAL_PERSONAL: "local-personal"
};
const OPENAI_MODEL = "gpt-5.2";

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    corrected: { type: "string" },
    safe: { type: "string" },
    better: { type: "string" },
    native: { type: "string" },
    thinking: { type: "string" }
  },
  required: ["corrected", "safe", "better", "native", "thinking"]
};

export function getOpenAIApiKey() {
  return localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || "";
}

export function saveOpenAIApiKey(apiKey) {
  const normalizedKey = apiKey.trim();
  if (normalizedKey) localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, normalizedKey);
  else localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
}

export function getRunMode() {
  return localStorage.getItem(RUN_MODE_STORAGE_KEY) === RUN_MODES.LOCAL_PERSONAL
    ? RUN_MODES.LOCAL_PERSONAL
    : RUN_MODES.DEMO;
}

export function saveRunMode(mode) {
  if (mode === RUN_MODES.LOCAL_PERSONAL) localStorage.setItem(RUN_MODE_STORAGE_KEY, mode);
  else localStorage.setItem(RUN_MODE_STORAGE_KEY, RUN_MODES.DEMO);
}

export async function analyzeWithOpenAI(question, userInput) {
  const apiKey = getOpenAIApiKey();
  const original = userInput.trim() || question.sampleInput;
  const prompt = buildAnalysisPrompt(question, original);

  if (!apiKey) {
    throw new Error("请先填写 OpenAI API Key。");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "japanese_communication_analysis",
          schema: analysisSchema,
          strict: true
        }
      },
      max_output_tokens: 1200
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI 分析失败：${response.status} ${detail}`);
  }

  const data = await response.json();
  const outputText = data.output_text || extractOutputText(data);

  if (!outputText) {
    throw new Error("AI 没有返回可解析的分析结果。");
  }

  return {
    original,
    prompt,
    ...JSON.parse(outputText)
  };
}

function extractOutputText(data) {
  return data.output
    ?.flatMap((item) => item.content || [])
    ?.filter((content) => content.type === "output_text")
    ?.map((content) => content.text)
    ?.join("")
    ?.trim();
}

const mockResults = {
  "work-deadline": {
    corrected: "この納期について、少しご相談させていただけますでしょうか。",
    safe: "申し訳ありませんが、現在のスケジュールですと納期に間に合わせるのが少し難しい状況です。",
    better: "納期に間に合わせるための調整案について、一度ご相談させていただけますでしょうか。",
    native: "少しスケジュールの見直しについて、ご相談させていただけますでしょうか。",
    thinking: "「無理です」は意思很清楚，但在日本职场里容易听起来像直接否定对方安排。更自然的顺序是先表达歉意，再说明当前状况，最后把诉求包装成“相談”。这样不是弱化问题，而是给对方留下调整和判断的空间。"
  },
  "nursery-delay": {
    corrected: "電車遅延の影響で、お迎えが少し遅れてしまいそうです。",
    safe: "ご迷惑をおかけして申し訳ありません。電車遅延のため、お迎えが少し遅れる見込みです。",
    better: "到着時間が分かり次第、改めてご連絡いたします。",
    native: "電車が遅れておりまして、お迎えが少し遅くなりそうです。到着時間が分かりましたら、すぐご連絡します。",
    thinking: "保育园沟通里，对方最关心的是孩子接送是否可预期。直接说“我会晚到”信息不够完整。日本式表达通常会先道歉，再说明原因和预计行动，让老师知道你不是随便迟到，而是在持续跟进。"
  },
  "clinic-symptoms": {
    corrected: "昨日から頭痛があり、少し熱もあります。",
    safe: "昨日から頭痛と発熱が続いていて、少し心配なので診ていただけますか。",
    better: "症状がいつから続いているか、熱の程度、他に気になる症状があるかを順番に伝えると診察が進みやすくなります。",
    native: "昨日から頭痛が続いていて、熱も少しあります。念のため診ていただきたいです。",
    thinking: "医院场景中不需要过度委婉，重点是按医生容易判断的顺序表达：什么时候开始、有什么症状、是否持续、希望对方做什么。中文里可能会先说“我不舒服”，但日语就诊时越具体越容易推进诊察。"
  }
};

export function analyzeMock(question, userInput) {
  const fallback = mockResults["work-deadline"];
  const original = userInput.trim() || question.sampleInput;
  const prompt = buildAnalysisPrompt(question, original);

  return {
    original,
    prompt,
    ...(mockResults[question.id] || fallback)
  };
}
