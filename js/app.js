import { RUN_MODES, analyzeMock, analyzeWithOpenAI, getOpenAIApiKey, getRunMode, saveOpenAIApiKey, saveRunMode } from "./analysis.js";
import { getDailyQuestion, getQuestion } from "./questions.js";
import { currentRoute, navigate, setRenderer, startRouter } from "./router.js";
import { getRecord, getRecords, saveRecord } from "./storage.js";
import { card, chips, el, metaGrid, patternList, resultBlock, topbar } from "./ui.js";

const app = document.querySelector("#app");
let activeQuestion = getDailyQuestion();

function render(route = currentRoute()) {
  app.replaceChildren();

  if (route.startsWith("/practice")) renderPractice();
  else if (route.startsWith("/result/")) renderResult(route.split("/")[2]);
  else if (route.startsWith("/history")) renderHistory();
  else renderHome();
}

function renderHome() {
  const question = getDailyQuestion();
  activeQuestion = question;

  app.append(
    el("main", { className: "screen" }, [
      el("section", { className: "hero" }, [
        el("h1", { text: "今天练一句就够了" }),
        el("p", { text: "把中文思维下的日语，换成日本人更容易接受的表达。" })
      ]),
      card([
        el("div", { className: "prompt" }, [
          el("p", { className: "status-line", text: "今日训练" }),
          el("h2", { className: "prompt-title", text: question.title }),
          el("p", { className: "prompt-copy", text: question.prompt })
        ])
      ]),
      metaGrid([
        { label: "场景", value: question.scenario },
        { label: "身份", value: question.role },
        { label: "情绪", value: question.emotion },
        { label: "目的", value: question.purpose }
      ]),
      card([
        el("h2", { className: "section-title", text: "关键词" }),
        chips(question.keywords)
      ], "stack"),
      card([
        el("h2", { className: "section-title", text: "句型提示" }),
        patternList(question.patterns)
      ], "stack"),
      el("button", { className: "primary-button", type: "button", text: "开始练习", onClick: () => navigate("/practice") }),
      el("button", { className: "ghost-button", type: "button", text: "查看历史", onClick: () => navigate("/history") })
    ])
  );
}

function renderPractice() {
  const question = activeQuestion;
  const input = el("textarea", {
    className: "text-input",
    rows: "6",
    placeholder: question.sampleInput,
    "aria-label": "输入你的日语表达"
  });
  const recorder = createRecorderControls();
  const speechRecognition = createSpeechRecognitionControls(input);
  const modeControls = createModeControls();
  const analyzeButton = el("button", {
    className: "primary-button",
    type: "button",
    text: "分析表达"
  });
  analyzeButton.addEventListener("click", () => createResult(question, input.value, analyzeButton));

  app.append(
    el("main", { className: "screen" }, [
      topbar("练习", () => navigate("/")),
      card([
        el("div", { className: "prompt" }, [
          el("p", { className: "status-line", text: `${question.scenario} / ${question.role}` }),
          el("h2", { className: "prompt-title", text: question.title }),
          el("p", { className: "prompt-copy", text: question.prompt })
        ])
      ]),
      card([
        el("h2", { className: "section-title", text: "关键词" }),
        chips(question.keywords)
      ], "stack"),
      card([
        el("h2", { className: "section-title", text: "可参考句型" }),
        patternList(question.patterns)
      ], "stack"),
      card([
        el("h2", { className: "section-title", text: "你的日语" }),
        input
      ], "stack"),
      card([
        el("h2", { className: "section-title", text: "语音转写" }),
        speechRecognition
      ], "stack"),
      card([
        el("h2", { className: "section-title", text: "录音练习" }),
        recorder
      ], "stack"),
      card([
        el("h2", { className: "section-title", text: "AI运行模式" }),
        modeControls
      ], "stack"),
      analyzeButton
    ])
  );
}

function createModeControls() {
  const currentMode = getRunMode();
  const status = el("p", {
    className: "recording-status",
    text: currentMode === RUN_MODES.DEMO
      ? "Demo Mode：GitHub Pages 默认安全模式，使用 Mock AI，不需要 API Key。"
      : "Local Personal Mode：只适合个人本地使用，不适合公开部署。"
  });
  const demoButton = el("button", { className: "record-button", type: "button", text: "Demo Mode" });
  const localButton = el("button", { className: "record-button", type: "button", text: "Local Personal" });
  const apiKeyControls = createApiKeyControls();
  const apiKeyPanel = el("div", { className: "mode-panel" }, [apiKeyControls]);

  function refreshMode() {
    const mode = getRunMode();
    const isLocal = mode === RUN_MODES.LOCAL_PERSONAL;
    status.textContent = isLocal
      ? "Local Personal Mode：只适合个人本地使用，不适合公开部署。API Key 仅保存在当前浏览器 LocalStorage。"
      : "Demo Mode：GitHub Pages 默认安全模式，使用 Mock AI，不需要 API Key。";
    demoButton.classList.toggle("active", !isLocal);
    localButton.classList.toggle("active", isLocal);
    apiKeyPanel.hidden = !isLocal;
  }

  demoButton.addEventListener("click", () => {
    saveRunMode(RUN_MODES.DEMO);
    refreshMode();
  });

  localButton.addEventListener("click", () => {
    saveRunMode(RUN_MODES.LOCAL_PERSONAL);
    refreshMode();
  });

  refreshMode();

  return el("div", { className: "recorder" }, [
    status,
    el("div", { className: "recorder-actions" }, [demoButton, localButton]),
    apiKeyPanel
  ]);
}

function createApiKeyControls() {
  const input = el("input", {
    className: "api-key-input",
    type: "password",
    placeholder: "输入 OpenAI API Key",
    value: getOpenAIApiKey(),
    autocomplete: "off",
    "aria-label": "OpenAI API Key"
  });
  const status = el("p", { className: "recording-status", text: getOpenAIApiKey() ? "API Key 已保存在本机浏览器。" : "API Key 只保存在本机浏览器，不会写入项目文件。" });
  const saveButton = el("button", { className: "record-button", type: "button", text: "保存Key" });
  const clearButton = el("button", { className: "record-button stop", type: "button", text: "清除Key" });

  saveButton.addEventListener("click", () => {
    saveOpenAIApiKey(input.value);
    status.textContent = getOpenAIApiKey() ? "API Key 已保存在本机浏览器。" : "请先输入 API Key。";
  });

  clearButton.addEventListener("click", () => {
    input.value = "";
    saveOpenAIApiKey("");
    status.textContent = "API Key 已清除。";
  });

  return el("div", { className: "recorder" }, [
    status,
    input,
    el("div", { className: "recorder-actions" }, [saveButton, clearButton])
  ]);
}

function createSpeechRecognitionControls(input) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let finalText = "";

  const status = el("p", { className: "recording-status", text: "点击开始识别，用日语说出你的回答。" });
  const transcript = el("div", { className: "transcript-box", text: "识别结果会实时显示在这里。" });
  const startButton = el("button", { className: "record-button", type: "button", text: "开始识别" });
  const stopButton = el("button", { className: "record-button stop", type: "button", text: "停止识别", disabled: true });

  function updateText(interimText = "") {
    const text = `${finalText}${interimText}`;
    transcript.textContent = text || "识别结果会实时显示在这里。";
    input.value = text;
  }

  function setListeningState(isListening) {
    startButton.disabled = isListening;
    stopButton.disabled = !isListening;
    startButton.textContent = isListening ? "识别中" : "开始识别";
  }

  startButton.addEventListener("click", () => {
    if (!Recognition) {
      status.textContent = "当前浏览器不支持 SpeechRecognition，请换用支持语音识别的浏览器。";
      return;
    }

    finalText = input.value.trim();
    if (finalText) finalText += " ";
    updateText();

    recognition = new Recognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.addEventListener("start", () => {
      status.textContent = "正在识别日语，请自然说话。";
      setListeningState(true);
    });

    recognition.addEventListener("result", (event) => {
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text;
        else interimText += text;
      }

      updateText(interimText);
    });

    recognition.addEventListener("error", () => {
      status.textContent = "识别中断，请确认麦克风权限或稍后重试。";
      setListeningState(false);
    });

    recognition.addEventListener("end", () => {
      status.textContent = finalText.trim() ? "识别已停止，可以编辑转写结果。" : "识别已停止，还没有识别到内容。";
      setListeningState(false);
      updateText();
    });

    try {
      recognition.start();
    } catch {
      status.textContent = "识别已经在进行中，请先停止后再开始。";
      setListeningState(true);
    }
  });

  stopButton.addEventListener("click", () => {
    if (recognition) {
      status.textContent = "正在停止识别...";
      recognition.stop();
    }
  });

  return el("div", { className: "recorder" }, [
    status,
    el("div", { className: "recorder-actions" }, [startButton, stopButton]),
    transcript
  ]);
}

function createRecorderControls() {
  let mediaRecorder = null;
  let stream = null;
  let chunks = [];
  let audioUrl = "";

  const status = el("p", { className: "recording-status", text: "可以先说一遍，再回放听听自己的表达。" });
  const audio = el("audio", { className: "audio-player", controls: true });
  audio.hidden = true;

  const startButton = el("button", { className: "record-button", type: "button", text: "开始录音" });
  const stopButton = el("button", { className: "record-button stop", type: "button", text: "停止录音", disabled: true });

  function setRecordingState(isRecording) {
    startButton.disabled = isRecording;
    stopButton.disabled = !isRecording;
    startButton.textContent = isRecording ? "录音中" : "开始录音";
  }

  function releaseStream() {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  startButton.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      status.textContent = "当前浏览器不支持录音，请换用支持 MediaRecorder 的浏览器。";
      return;
    }

    try {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = "";
      audio.hidden = true;
      audio.removeAttribute("src");
      chunks = [];

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
        audioUrl = URL.createObjectURL(blob);
        audio.src = audioUrl;
        audio.hidden = false;
        status.textContent = "录音完成，可以点击播放回听。";
        setRecordingState(false);
        releaseStream();
      });

      mediaRecorder.start();
      status.textContent = "正在录音，请自然说出你的日语表达。";
      setRecordingState(true);
    } catch {
      status.textContent = "无法开始录音，请确认已经允许麦克风权限。";
      setRecordingState(false);
      releaseStream();
    }
  });

  stopButton.addEventListener("click", () => {
    if (mediaRecorder?.state === "recording") {
      status.textContent = "正在整理录音...";
      mediaRecorder.stop();
    }
  });

  return el("div", { className: "recorder" }, [
    status,
    el("div", { className: "recorder-actions" }, [startButton, stopButton]),
    audio
  ]);
}

async function createResult(question, userInput, button) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "分析中...";

  try {
    const analysis = getRunMode() === RUN_MODES.LOCAL_PERSONAL
      ? await analyzeWithOpenAI(question, userInput)
      : analyzeMock(question, userInput);
    const record = {
      id: `${Date.now()}`,
      questionId: question.id,
      createdAt: new Date().toISOString(),
      questionTitle: question.title,
      scenario: question.scenario,
      role: question.role,
      emotion: question.emotion,
      purpose: question.purpose,
      ...analysis
    };

    saveRecord(record);
    navigate(`/result/${record.id}`);
  } catch (error) {
    alert(error.message || "AI 分析失败，请稍后重试。");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function renderResult(id) {
  const record = getRecord(id) || getRecords()[0];
  if (!record) {
    navigate("/");
    return;
  }

  const question = getQuestion(record.questionId);
  activeQuestion = question;

  app.append(
    el("main", { className: "screen" }, [
      topbar("分析结果", () => navigate("/history")),
      card([
        el("div", { className: "prompt" }, [
          el("p", { className: "status-line", text: `${record.scenario} / ${record.role}` }),
          el("h2", { className: "prompt-title", text: record.questionTitle })
        ])
      ]),
      resultBlock("原文", record.original, true),
      resultBlock("修正版", record.corrected),
      resultBlock("安全牌", record.safe),
      resultBlock("加分牌", record.better),
      resultBlock("地道牌", record.native || record.better),
      resultBlock("日本式思维解析", record.thinking || record.explanation),
      el("div", { className: "two-actions" }, [
        el("button", { className: "secondary-button", type: "button", text: "再练一题", onClick: () => navigate("/practice") }),
        el("button", { className: "ghost-button", type: "button", text: "历史记录", onClick: () => navigate("/history") })
      ])
    ])
  );
}

function renderHistory() {
  const records = getRecords();

  app.append(
    el("main", { className: "screen" }, [
      topbar("历史记录", () => navigate("/")),
      records.length
        ? el("section", { className: "history-list" }, records.map((record) => historyItem(record)))
        : card([
            el("div", { className: "empty" }, [
              el("p", { text: "还没有练习记录。" }),
              el("p", { text: "完成一次练习后，会在这里看到结果。" })
            ])
          ]),
      el("button", { className: "primary-button", type: "button", text: "开始今日训练", onClick: () => navigate("/") })
    ])
  );
}

function historyItem(record) {
  return el("button", { className: "history-item", type: "button", onClick: () => navigate(`/result/${record.id}`) }, [
    el("span", { className: "history-date", text: formatDate(record.createdAt) }),
    el("span", { className: "history-title", text: `${record.scenario} / ${record.purpose}` }),
    el("p", { className: "history-excerpt", text: record.original })
  ]);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}

setRenderer(render);
startRouter();
