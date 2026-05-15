/* ===== 三主题（含夜间） ===== */
export var themes = [
  {
    id: "tangli", name: "\u68E0\u68A8\u00B7\u8584\u8377", emoji: "\uD83C\uDF3F",
    bg: "#F7F5F3", surface: "rgba(255,255,255,0.70)", solid: "#FFFFFF",
    border: "rgba(255,255,255,0.8)", borderSub: "rgba(0,0,0,0.04)",
    text: "#2D2D2D", sub: "#9C8A82",
    accent: "#E09090", accentLight: "#E0909015",
    accent2: "#CBA87A", fresh: "#84BFA6",
    freshLight: "#84BFA615", freshBorder: "#84BFA644",
    cards: [["#E09090","#F0B8B8"],["#CBA87A","#E0C9A0"],["#84BFA6","#A6D4B8"]],
  },
  {
    id: "yueji", name: "\u6708\u9701\u00B7\u6696\u7A97", emoji: "\uD83C\uDF19",
    bg: "#F6F5F3", surface: "rgba(255,255,255,0.70)", solid: "#FFFFFF",
    border: "rgba(255,255,255,0.8)", borderSub: "rgba(0,0,0,0.04)",
    text: "#2D2D2D", sub: "#8E8D8A",
    accent: "#7EB5E2", accentLight: "#7EB5E215",
    accent2: "#C5A3D4", fresh: "#F4C2C2",
    freshLight: "#F4C2C215", freshBorder: "#F4C2C244",
    cards: [["#7EB5E2","#BBDEFB"],["#C5A3D4","#E1BEE7"],["#F4C2C2","#F8D7DA"]],
  },
  {
    id: "night", name: "\u665A\u5B89\u00B7\u6708\u5149", emoji: "\uD83C\uDF1A",
    bg: "#1C1C1E", surface: "rgba(44,44,46,0.85)", solid: "#2C2C2E",
    border: "rgba(56,56,58,0.6)", borderSub: "rgba(255,255,255,0.08)",
    text: "#D1D1D6", sub: "#8E8E93",
    accent: "#D4A0A0", accentLight: "#D4A0A020",
    accent2: "#A8A0C0", fresh: "#7DBBA0",
    freshLight: "#7DBBA018", freshBorder: "#7DBBA040",
    cards: [["#8B6060","#6B4040"],["#706080","#504060"],["#507060","#305040"]],
  },
];

/* ===== 字体预设 ===== */
export var fontPresets = [
  { name: "\u9ED8\u8BA4", cn: "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif" },
  { name: "\u6977\u4E66", cn: "'Kaiti SC', 'STKaiti', KaiTi, 'AR PL KaitiM GB', 'Times New Roman', Georgia, serif" },
  { name: "\u5B8B\u4F53", cn: "'Songti SC', 'STSong', SimSun, NSimSun, 'Times New Roman', Georgia, serif" },
];

/* ===== 气泡配色 5 组 ===== */
export var bubblePresets = [
  { name: "\u84DD\u6A59", emoji: "\uD83C\uDF4A", user: "#ffdda5", userText: "#5D4820", ai: "#bbdfff", aiText: "#1E3A5F" },
  { name: "\u7C89\u7EFF", emoji: "\uD83C\uDF3F", user: "#F2D0D0", userText: "#6B4040", ai: "#D2ECCC", aiText: "#3D5030" },
  { name: "\u5976\u7D2B\u9E45\u9EC4", emoji: "\uD83E\uDDA2", user: "#E8DFF0", userText: "#4A3660", ai: "#FFF3D6", aiText: "#5D4E30" },
  { name: "\u9752\u84DD\u5976\u767D", emoji: "\uD83E\uDEE7", user: "#a8d4ce", userText: "#f8f6f0", ai: "#f7f7ea", aiText: "#9b6a3c" },
  { name: "\u5de7\u514b\u529b", emoji: "\uD83C\uDF6B", user: "#fff4ef", userText: "#6b4035", ai: "#7d524b", aiText: "#f5ece8" },
];

/* ===== 划线颜色 ===== */
export var highlightColors = [
  { name: "\u7C89", color: "#F4C2C2" },
  { name: "\u9EC4", color: "#FFF0A0" },
  { name: "\u7EFF", color: "#C8E6D0" },
  { name: "\u84DD", color: "#BBDFFF" },
  { name: "\u7D2B", color: "#E8DFF0" },
];

/* ===== 默认设置 ===== */
export var defaultSettings = {
  themeIndex: 0,
  bubbleIndex: 1,
  fontIndex: 0,
  scrollMode: false,
  aiStoryEnabled: true,
  aiAnnotationEnabled: true,
  aiDiscussEnabled: true,
  apiUrl: "https://openrouter.ai/api/v1/chat/completions",
  apiKey: "",
  modelName: "",
  storyModelName: "",
  annotationModelName: "",
  discussModelName: "",
  promptTemplates: [
    { name: "\u5B66\u4E60\u6A21\u5F0F", prompt: "\u4F60\u662F\u4E00\u4F4D\u8010\u5FC3\u7684\u8001\u5E08\uFF0C\u7528\u901A\u4FD7\u6613\u61C2\u7684\u5927\u767D\u8BDD\u5E2E\u6211\u8BB2\u89E3\u8FD9\u6BB5\u5185\u5BB9\uFF0C\u591A\u7528\u751F\u6D3B\u4E2D\u7684\u4F8B\u5B50\u3002" },
    { name: "\u5410\u69FD\u6A21\u5F0F", prompt: "\u4F60\u662F\u4E00\u4E2A\u6BD2\u820C\u8BFB\u8005\uFF0C\u8BFB\u5B8C\u540E\u5410\u69FD\u5267\u60C5\u3001\u5206\u6790\u89D2\u8272\uFF0C\u8BED\u6C14\u8F7B\u677E\u5E7D\u9ED8\u3002" },
    { name: "\u7FFB\u8BD1\u6A21\u5F0F", prompt: "\u4F60\u662F\u7FFB\u8BD1\u52A9\u624B\uFF0C\u7528\u81EA\u7136\u6D41\u7545\u7684\u4E2D\u6587\u7FFB\u8BD1\u82F1\u6587\u5185\u5BB9\uFF0C\u5E76\u89E3\u91CA\u91CD\u8981\u8BCD\u6C47\u548C\u8868\u8FBE\u3002" },
  ],
  activePromptIndex: 0,
  annotationPrompt: "\u4F60\u662F\u4E00\u4E2A\u6709\u89C1\u5730\u7684\u8BFB\u8005\uFF0C\u8BFB\u5B8C\u8FD9\u4E00\u7AE0\u540E\uFF0C\u81EA\u7531\u9009\u62E93-5\u4E2A\u4F60\u89C9\u5F97\u6709\u610F\u601D\u7684\u6BB5\u843D\uFF0C\u5199\u4E0B\u4F60\u7684\u611F\u60F3\u3001\u5410\u69FD\u6216\u5206\u6790\u3002",
  aiPersona: "",
  parasPerPage: 8,
  charsPerPage: 3000,
  /* 记忆系统 */
  summaryMode: "detail",    /* off / brief / detail */
  chapterContextMode: "summary", /* summary / summary+feelings / summary+feelings+ann */
  contextBudget: 2000,      /* 前情注入最大token */
  /* 聊这段 */
  chatParaContext: "nearby", /* nearby=前后3段 / full=全章+极简梗概 */
  /* 对话 */
  chatKeepCount: 20,        /* 对话保留条数 */
  maxOutputTokens: 2000,    /* AI输出上限 */
  inputWarnTokens: 8000,    /* 输入预警阈值 */
  /* 划线 */
  highlightColor: "#F4C2C2", /* 当前选中的划线颜色 */
};
