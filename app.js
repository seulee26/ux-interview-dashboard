const SAMPLE_DATA = [
  {
    participant_id: "P01",
    segment: "New user",
    sentiment: "negative",
    theme: "Onboarding friction",
    severity: 5,
    score: 2,
    quote: "I was not sure what to do next after signup.",
  },
  {
    participant_id: "P02",
    segment: "Power user",
    sentiment: "positive",
    theme: "Workflow speed",
    severity: 2,
    score: 5,
    quote: "Once I learned the shortcuts, the flow felt very efficient.",
  },
  {
    participant_id: "P03",
    segment: "New user",
    sentiment: "negative",
    theme: "Navigation clarity",
    severity: 4,
    score: 2,
    quote: "The labels look familiar, but the structure is hard to predict.",
  },
  {
    participant_id: "P04",
    segment: "Admin",
    sentiment: "neutral",
    theme: "Permissions",
    severity: 3,
    score: 3,
    quote: "I can do the task, but the access rules are not obvious.",
  },
  {
    participant_id: "P05",
    segment: "Power user",
    sentiment: "positive",
    theme: "Search",
    severity: 1,
    score: 4,
    quote: "Search is fast when I know the exact term.",
  },
  {
    participant_id: "P06",
    segment: "Manager",
    sentiment: "negative",
    theme: "Reporting gaps",
    severity: 5,
    score: 2,
    quote: "The summary view does not tell me enough to make a decision.",
  },
  {
    participant_id: "P07",
    segment: "Manager",
    sentiment: "neutral",
    theme: "Reporting gaps",
    severity: 4,
    score: 3,
    quote: "I need one or two additional metrics before I can trust the readout.",
  },
  {
    participant_id: "P08",
    segment: "New user",
    sentiment: "positive",
    theme: "Guidance quality",
    severity: 2,
    score: 4,
    quote: "The helper text made the first step much easier.",
  },
];

const state = {
  data: SAMPLE_DATA.map(normalizeRow),
  sourceLabel: "Demo sample",
  chatMessages: [
    {
      role: "agent",
      text:
        "Ask me what the interviews are saying. I can summarize issues, rank themes, pull quotes, and suggest next steps from the current filtered view.",
    },
  ],
  filters: {
    search: "",
    segment: "all",
    sentiment: "all",
    severity: 0,
  },
};

const els = {
  fileInput: document.getElementById("fileInput"),
  loadDemoButton: document.getElementById("loadDemoButton"),
  resetFiltersButton: document.getElementById("resetFiltersButton"),
  searchInput: document.getElementById("searchInput"),
  segmentFilter: document.getElementById("segmentFilter"),
  sentimentFilter: document.getElementById("sentimentFilter"),
  severityFilter: document.getElementById("severityFilter"),
  datasetLabel: document.getElementById("datasetLabel"),
  updatedLabel: document.getElementById("updatedLabel"),
  kpiGrid: document.getElementById("kpiGrid"),
  themeChart: document.getElementById("themeChart"),
  segmentChart: document.getElementById("segmentChart"),
  insightList: document.getElementById("insightList"),
  quoteList: document.getElementById("quoteList"),
  rowTable: document.getElementById("rowTable"),
  themeCountChip: document.getElementById("themeCountChip"),
  segmentCountChip: document.getElementById("segmentCountChip"),
  rowCountChip: document.getElementById("rowCountChip"),
  agentScopeChip: document.getElementById("agentScopeChip"),
  chatLog: document.getElementById("chatLog"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
};

els.fileInput.addEventListener("change", handleFileUpload);
els.loadDemoButton.addEventListener("click", loadDemoData);
els.resetFiltersButton.addEventListener("click", resetFilters);
els.searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value.trim().toLowerCase();
  render();
});
els.segmentFilter.addEventListener("change", (event) => {
  state.filters.segment = event.target.value;
  render();
});
els.sentimentFilter.addEventListener("change", (event) => {
  state.filters.sentiment = event.target.value;
  render();
});
els.severityFilter.addEventListener("change", (event) => {
  state.filters.severity = Number(event.target.value);
  render();
});
els.chatForm.addEventListener("submit", handleChatSubmit);
document.querySelectorAll(".prompt-button").forEach((button) => {
  button.addEventListener("click", () => askAgent(button.dataset.prompt || ""));
});

init();

function init() {
  populateSegmentFilter(state.data);
  render();
}

function resetFilters() {
  state.filters = {
    search: "",
    segment: "all",
    sentiment: "all",
    severity: 0,
  };
  els.searchInput.value = "";
  els.segmentFilter.value = "all";
  els.sentimentFilter.value = "all";
  els.severityFilter.value = "0";
  render();
}

function loadDemoData() {
  state.data = SAMPLE_DATA.map(normalizeRow);
  state.sourceLabel = "Demo sample";
  populateSegmentFilter(state.data);
  resetFilters();
  render();
}

function handleFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const parsed = parseUpload(file.name, text);
      state.data = parsed.map(normalizeRow).filter(Boolean);
      state.sourceLabel = file.name;
      populateSegmentFilter(state.data);
      resetFilters();
      render();
    } catch (error) {
      console.error(error);
      alert(`Could not read file: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function parseUpload(fileName, text) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json")) {
    const json = JSON.parse(text);
    if (!Array.isArray(json)) {
      throw new Error("JSON must be an array of interview rows.");
    }
    return json;
  }

  return parseCSV(text);
}

function parseCSV(text) {
  const rows = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (!lines.length) return rows;

  const headers = splitCSVLine(lines.shift()).map((header) => header.trim());
  for (const line of lines) {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function normalizeRow(row, index = 0) {
  const source = row || {};
  const participant =
    stringValue(source.participant_id) ||
    stringValue(source.participant) ||
    stringValue(source.id) ||
    `Row ${index + 1}`;
  const segment =
    stringValue(source.segment) ||
    stringValue(source.persona) ||
    stringValue(source.role) ||
    "Unspecified";
  const theme =
    stringValue(source.theme) ||
    stringValue(source.topic) ||
    stringValue(source.pain_point) ||
    stringValue(source.category) ||
    "Uncategorized";
  const sentiment = normalizeSentiment(
    source.sentiment ?? source.sentiment_label ?? source.tone ?? source.score ?? source.rating,
  );
  const severity = normalizeSeverity(
    source.severity ?? source.priority ?? source.impact ?? source.score ?? source.rating,
  );
  const score = normalizeScore(source.score ?? source.rating ?? source.satisfaction ?? source.nps);
  const quote =
    stringValue(source.quote) ||
    stringValue(source.snippet) ||
    stringValue(source.notes) ||
    stringValue(source.comment) ||
    "";

  return {
    participant,
    segment,
    theme,
    sentiment,
    severity,
    score,
    quote,
    raw: source,
  };
}

function stringValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeSentiment(value) {
  const raw = stringValue(value).toLowerCase();
  if (["positive", "pos", "good", "happy", "love", "strong"].includes(raw)) return "positive";
  if (["negative", "neg", "bad", "sad", "frustrated", "painful"].includes(raw)) return "negative";
  if (["neutral", "mixed", "ok", "okay"].includes(raw)) return "neutral";

  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) {
    if (numeric >= 4) return "positive";
    if (numeric <= 2) return "negative";
    return "neutral";
  }

  return "neutral";
}

function normalizeSeverity(value) {
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return clamp(Math.round(numeric), 1, 5);
  }

  const raw = stringValue(value).toLowerCase();
  if (raw === "high") return 5;
  if (raw === "medium") return 3;
  if (raw === "low") return 1;
  return 3;
}

function normalizeScore(value) {
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return clamp(numeric, 0, 5);
  return null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function populateSegmentFilter(rows) {
  const segments = Array.from(new Set(rows.map((row) => row.segment))).sort((a, b) => a.localeCompare(b));
  els.segmentFilter.innerHTML = [
    `<option value="all">All</option>`,
    ...segments.map((segment) => `<option value="${escapeHtml(segment)}">${escapeHtml(segment)}</option>`),
  ].join("");
}

function render() {
  const filtered = applyFilters(state.data, state.filters);
  const metrics = calculateMetrics(filtered);

  els.datasetLabel.textContent = state.sourceLabel;
  els.updatedLabel.textContent = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  renderKpis(metrics);
  renderThemeChart(metrics.themeStats);
  renderSegmentChart(metrics.segmentStats);
  renderInsights(metrics);
  renderQuotes(filtered, metrics);
  renderTable(filtered);
  renderChat(filtered);
  updateChips(metrics);
}

function applyFilters(rows, filters) {
  return rows.filter((row) => {
    const searchText = [row.participant, row.segment, row.theme, row.quote].join(" ").toLowerCase();
    if (filters.search && !searchText.includes(filters.search)) return false;
    if (filters.segment !== "all" && row.segment !== filters.segment) return false;
    if (filters.sentiment !== "all" && row.sentiment !== filters.sentiment) return false;
    if (row.severity < filters.severity) return false;
    return true;
  });
}

function calculateMetrics(rows) {
  const participantCount = new Set(rows.map((row) => row.participant)).size;
  const themeMap = new Map();
  const segmentMap = new Map();
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  let scoreSum = 0;
  let scoredCount = 0;

  for (const row of rows) {
    themeMap.set(row.theme, (themeMap.get(row.theme) || 0) + 1);
    segmentMap.set(row.segment, (segmentMap.get(row.segment) || 0) + 1);
    sentimentCounts[row.sentiment] += 1;
    if (typeof row.score === "number") {
      scoreSum += row.score;
      scoredCount += 1;
    }
  }

  const themeStats = Array.from(themeMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const segmentStats = Array.from(segmentMap.entries())
    .map(([name, count]) => ({ name, count, avgSentiment: averageSentiment(rows.filter((row) => row.segment === name)) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const severeIssues = rows.filter((row) => row.severity >= 4).length;

  return {
    rows,
    participantCount: participantCount || 0,
    themeCount: themeStats.length,
    themeStats,
    segmentStats,
    sentimentCounts,
    averageScore: scoredCount ? scoreSum / scoredCount : null,
    severeIssues,
    topTheme: themeStats[0] || null,
    worstTheme: themeStats.find((item) => item.name && rows.some((row) => row.theme === item.name && row.sentiment === "negative")) || null,
    bestSegment: segmentStats
      .slice()
      .sort((a, b) => b.avgSentiment - a.avgSentiment || b.count - a.count)[0] || null,
    worstSegment: segmentStats
      .slice()
      .sort((a, b) => a.avgSentiment - b.avgSentiment || b.count - a.count)[0] || null,
    representativeQuote: rows.find((row) => row.sentiment === "negative" && row.quote) || rows.find((row) => row.quote) || null,
    strongestQuote: rows.find((row) => row.sentiment === "positive" && row.quote) || null,
  };
}

function averageSentiment(rows) {
  if (!rows.length) return 0;
  const total = rows.reduce((sum, row) => sum + sentimentValue(row.sentiment), 0);
  return total / rows.length;
}

function sentimentValue(sentiment) {
  if (sentiment === "positive") return 1;
  if (sentiment === "negative") return -1;
  return 0;
}

function renderKpis(metrics) {
  const cards = [
    { label: "Interviews", value: metrics.participantCount, delta: "Unique participants in the filtered view" },
    { label: "Themes", value: metrics.themeCount, delta: "Distinct themes surfaced by the interviews" },
    {
      label: "Avg score",
      value: metrics.averageScore === null ? "n/a" : metrics.averageScore.toFixed(1),
      delta: "Average numeric score across available rows",
    },
    { label: "Severe issues", value: metrics.severeIssues, delta: "Rows with severity 4 or 5" },
    {
      label: "Net sentiment",
      value: formatNetSentiment(metrics.sentimentCounts),
      delta: "Positive minus negative mentions",
    },
  ];

  els.kpiGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="panel kpi">
          <div class="label">${escapeHtml(card.label)}</div>
          <div class="value">${escapeHtml(String(card.value))}</div>
          <div class="delta">${escapeHtml(card.delta)}</div>
        </article>
      `,
    )
    .join("");
}

function formatNetSentiment(counts) {
  const net = counts.positive - counts.negative;
  if (net > 0) return `+${net}`;
  if (net < 0) return `${net}`;
  return "0";
}

function renderThemeChart(themeStats) {
  if (!themeStats.length) {
    els.themeChart.innerHTML = emptyState();
    return;
  }

  const max = Math.max(...themeStats.map((item) => item.count));
  els.themeChart.innerHTML = themeStats
    .slice(0, 8)
    .map((item) => {
      const width = (item.count / max) * 100;
      const tone = item.count >= max * 0.75 ? "warning" : "";
      return `
        <div class="bar-row">
          <div class="bar-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${item.count}</span>
          </div>
          <div class="bar-track"><div class="bar-fill ${tone}" style="width:${width}%"></div></div>
          <div class="bar-note">Mentions among filtered rows</div>
        </div>
      `;
    })
    .join("");
}

function renderSegmentChart(segmentStats) {
  if (!segmentStats.length) {
    els.segmentChart.innerHTML = emptyState();
    return;
  }

  const max = Math.max(...segmentStats.map((item) => Math.max(Math.abs(item.avgSentiment), 0.1)));
  els.segmentChart.innerHTML = segmentStats
    .slice(0, 8)
    .map((item) => {
      const width = Math.min(100, (Math.abs(item.avgSentiment) / max) * 100);
      const tone = item.avgSentiment < 0 ? "negative" : item.avgSentiment > 0 ? "" : "warning";
      return `
        <div class="bar-row">
          <div class="bar-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${item.avgSentiment.toFixed(2)}</span>
          </div>
          <div class="bar-track"><div class="bar-fill ${tone}" style="width:${width}%"></div></div>
          <div class="bar-note">Average sentiment score for this segment</div>
        </div>
      `;
    })
    .join("");
}

function renderInsights(metrics) {
  const insights = [];

  if (metrics.topTheme) {
    insights.push({
      title: "Top recurring theme",
      body: `${metrics.topTheme.name} appears in ${metrics.topTheme.count} rows, making it the most repeated topic in the filtered set.`,
    });
  }

  if (metrics.bestSegment) {
    insights.push({
      title: "Strongest segment",
      body: `${metrics.bestSegment.name} has the highest average sentiment (${metrics.bestSegment.avgSentiment.toFixed(2)}).`,
    });
  }

  if (metrics.worstSegment) {
    insights.push({
      title: "Most fragile segment",
      body: `${metrics.worstSegment.name} has the weakest sentiment profile (${metrics.worstSegment.avgSentiment.toFixed(2)}).`,
    });
  }

  if (metrics.severeIssues > 0) {
    insights.push({
      title: "Escalation watch",
      body: `${metrics.severeIssues} row(s) are marked severe, so these items should be included in the next synthesis pass.`,
    });
  }

  if (!insights.length) {
    els.insightList.innerHTML = emptyState();
    return;
  }

  els.insightList.innerHTML = insights
    .map(
      (insight) => `
        <div class="insight">
          <strong>${escapeHtml(insight.title)}</strong>
          <span>${escapeHtml(insight.body)}</span>
        </div>
      `,
    )
    .join("");
}

function renderQuotes(filteredRows, metrics) {
  const quotes = [];

  if (metrics.representativeQuote) {
    quotes.push(metrics.representativeQuote);
  }
  if (metrics.strongestQuote && metrics.strongestQuote !== metrics.representativeQuote) {
    quotes.push(metrics.strongestQuote);
  }

  const uniqueQuotes = quotes.filter((row, index, list) => list.findIndex((item) => item.quote === row.quote) === index);

  if (!uniqueQuotes.length) {
    els.quoteList.innerHTML = emptyState();
    return;
  }

  els.quoteList.innerHTML = uniqueQuotes
    .map((row) => {
      const sentimentClass = row.sentiment;
      return `
        <div class="quote">
          <div>${escapeHtml(row.quote)}</div>
          <div class="meta">
            <span class="tag ${sentimentClass}">${escapeHtml(row.sentiment)}</span>
            <span>${escapeHtml(row.participant)}</span>
            <span>${escapeHtml(row.segment)}</span>
            <span>${escapeHtml(row.theme)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTable(rows) {
  els.rowCountChip.textContent = `${rows.length} rows`;
  if (!rows.length) {
    els.rowTable.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">No rows match the current filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  els.rowTable.innerHTML = rows
    .slice(0, 12)
    .map((row) => {
      return `
        <tr>
          <td>${escapeHtml(row.participant)}</td>
          <td>${escapeHtml(row.segment)}</td>
          <td>${escapeHtml(row.theme)}</td>
          <td><span class="tag ${row.sentiment}">${escapeHtml(row.sentiment)}</span></td>
          <td class="severity">${row.severity}</td>
          <td>${row.score === null ? "n/a" : row.score.toFixed(1)}</td>
          <td>${escapeHtml(truncate(row.quote || "", 96))}</td>
        </tr>
      `;
    })
    .join("");
}

function updateChips(metrics) {
  els.themeCountChip.textContent = `${metrics.themeCount} themes`;
  els.segmentCountChip.textContent = `${metrics.segmentStats.length} segments`;
  els.agentScopeChip.textContent = `${metrics.rows.length} rows in scope`;
}

function handleChatSubmit(event) {
  event.preventDefault();
  const question = els.chatInput.value.trim();
  if (!question) return;
  askAgent(question);
}

function askAgent(question) {
  const filtered = applyFilters(state.data, state.filters);
  const answer = buildAgentAnswer(question, filtered);
  state.chatMessages.push({ role: "user", text: question });
  state.chatMessages.push({ role: "agent", text: answer });
  els.chatInput.value = "";
  renderChat(filtered);
}

function renderChat(filteredRows) {
  els.chatLog.innerHTML = state.chatMessages
    .map((message) => {
      return `
        <div class="chat-message ${message.role}">
          <div class="chat-bubble">${formatAgentText(message.text)}</div>
        </div>
      `;
    })
    .join("");
  els.chatLog.scrollTop = els.chatLog.scrollHeight;

  if (!filteredRows.length && state.chatMessages.length === 1) {
    els.chatLog.innerHTML += `
      <div class="chat-message agent">
        <div class="chat-bubble">No interview rows match the current filters yet. Reset filters or upload a file to start asking questions.</div>
      </div>
    `;
  }
}

function buildAgentAnswer(question, rows) {
  if (!rows.length) {
    return "No rows match the current filters, so I do not have interview evidence to analyze. Reset filters or upload a broader dataset.";
  }

  const intent = question.toLowerCase();
  const locale = /[가-힣]/.test(question) ? "ko" : "en";
  const metrics = calculateMetrics(rows);

  if (matchesAny(intent, ["quote", "quotes", "evidence", "verbatim", "인용", "인용문", "근거", "증거", "발화"])) {
    return buildQuoteAnswer(rows, locale);
  }

  if (matchesAny(intent, ["prioritize", "priority", "first", "important", "severe", "risk", "우선", "우선순위", "먼저", "중요", "심각", "리스크"])) {
    return buildPriorityAnswer(rows, metrics, locale);
  }

  if (matchesAny(intent, ["next", "action", "recommend", "roadmap", "product team", "do next", "다음", "액션", "추천", "해야", "제품팀", "기획"])) {
    return buildActionAnswer(rows, metrics, locale);
  }

  if (matchesAny(intent, ["sentiment", "positive", "negative", "segment", "persona", "감정", "긍정", "부정", "세그먼트", "페르소나"])) {
    return buildSentimentAnswer(metrics, locale);
  }

  if (matchesAny(intent, ["theme", "themes", "pain", "issue", "problem", "summary", "summarize", "overview", "테마", "주제", "불편", "이슈", "문제", "요약", "정리"])) {
    return buildSummaryAnswer(metrics, locale);
  }

  return buildDefaultAnswer(metrics, locale);
}

function buildSummaryAnswer(metrics, locale = "en") {
  const topThemes = metrics.themeStats
    .slice(0, 3)
    .map((theme, index) => `${index + 1}. ${theme.name} (${theme.count} mentions)`)
    .join("\n");
  const score = metrics.averageScore === null ? "no score data" : `${metrics.averageScore.toFixed(1)} average score`;

  if (locale === "ko") {
    const koreanScore = metrics.averageScore === null ? "점수 데이터 없음" : `평균 점수 ${metrics.averageScore.toFixed(1)}`;
    const koreanThemes = metrics.themeStats
      .slice(0, 3)
      .map((theme, index) => `${index + 1}. ${theme.name} (${theme.count}건)`)
      .join("\n");

    return [
      `현재 범위에는 참여자 ${metrics.participantCount}명, 테마 ${metrics.themeCount}개, 심각도 높은 이슈 ${metrics.severeIssues}건이 있습니다.`,
      `상위 테마:\n${koreanThemes || "아직 뚜렷한 테마가 없습니다."}`,
      `전체 신호는 ${koreanScore}, 순감정은 ${formatNetSentiment(metrics.sentimentCounts)}입니다.`,
    ].join("\n\n");
  }

  return [
    `I see ${metrics.participantCount} participants, ${metrics.themeCount} themes, and ${metrics.severeIssues} severe issue rows in this view.`,
    `Top themes:\n${topThemes || "No clear themes yet."}`,
    `The health signal is ${score}, with net sentiment at ${formatNetSentiment(metrics.sentimentCounts)}.`,
  ].join("\n\n");
}

function buildPriorityAnswer(rows, metrics, locale = "en") {
  const candidates = metrics.themeStats
    .map((theme) => {
      const themeRows = rows.filter((row) => row.theme === theme.name);
      const severeCount = themeRows.filter((row) => row.severity >= 4).length;
      const negativeCount = themeRows.filter((row) => row.sentiment === "negative").length;
      const avgSeverity = themeRows.reduce((sum, row) => sum + row.severity, 0) / themeRows.length;
      return {
        ...theme,
        severeCount,
        negativeCount,
        avgSeverity,
        priorityScore: theme.count + severeCount * 2 + negativeCount * 1.5 + avgSeverity,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || b.count - a.count);

  const top = candidates[0];
  if (!top) return locale === "ko" ? "아직 우선순위를 정할 만큼 테마 근거가 충분하지 않습니다." : "I do not see enough theme evidence to prioritize yet.";

  const supportingQuote = rows.find((row) => row.theme === top.name && row.quote && row.severity >= 4) || rows.find((row) => row.theme === top.name && row.quote);

  if (locale === "ko") {
    return [
      `먼저 볼 테마는 ${top.name}입니다.`,
      `이유: 언급 ${top.count}건, 심각도 높은 행 ${top.severeCount}건, 부정 응답 ${top.negativeCount}건, 평균 심각도 ${top.avgSeverity.toFixed(1)}입니다.`,
      supportingQuote ? `근거: "${supportingQuote.quote}" - ${supportingQuote.participant}, ${supportingQuote.segment}` : "근거: 이 테마에 연결된 quote가 아직 없습니다.",
    ].join("\n\n");
  }

  return [
    `I would prioritize ${top.name} first.`,
    `Why: ${top.count} mentions, ${top.severeCount} severe rows, ${top.negativeCount} negative rows, and ${top.avgSeverity.toFixed(1)} average severity.`,
    supportingQuote ? `Evidence: "${supportingQuote.quote}" - ${supportingQuote.participant}, ${supportingQuote.segment}` : "Evidence: no quote is available for that theme yet.",
  ].join("\n\n");
}

function buildActionAnswer(rows, metrics, locale = "en") {
  const priority = metrics.themeStats[0];
  const severeRows = rows.filter((row) => row.severity >= 4);
  const weakSegment = metrics.worstSegment;

  const actions =
    locale === "ko"
      ? [
          priority ? `${priority.name}에 대한 집중 디자인 패스를 먼저 진행하세요. 현재 범위에서 가장 반복되는 테마입니다.` : "제품 작업을 정하기 전에 인터뷰 테마를 먼저 정규화하세요.",
          severeRows.length
            ? `심각도 높은 ${severeRows.length}건을 짧은 escalation 목록으로 만들고, 각 항목의 담당자를 확인하세요.`
            : "다음 synthesis에서 작은 사용성 개선과 실제 blocker를 분리하세요.",
          weakSegment ? `${weakSegment.name} 경험을 따로 리뷰하세요. 감정 신호가 가장 약합니다 (${weakSegment.avgSentiment.toFixed(2)}).` : "문제가 어디에 집중되는지 보이도록 segment 라벨을 보강하세요.",
        ]
      : [
          priority ? `Run a focused design pass on ${priority.name}; it is the most repeated theme in this view.` : "Normalize the interview themes before planning product work.",
          severeRows.length
            ? `Create a short escalation list from the ${severeRows.length} severe rows, then check whether each has a clear owner.`
            : "Use the next synthesis pass to separate small usability polish from true blockers.",
          weakSegment ? `Review the experience for ${weakSegment.name}; it has the weakest sentiment signal (${weakSegment.avgSentiment.toFixed(2)}).` : "Add segment labels so the team can see where the problem is concentrated.",
        ];

  const title = locale === "ko" ? "추천 다음 액션" : "Recommended next steps";
  return `${title}:\n${actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}`;
}

function buildQuoteAnswer(rows, locale = "en") {
  const quotes = rows
    .filter((row) => row.quote)
    .sort((a, b) => b.severity - a.severity || sentimentValue(a.sentiment) - sentimentValue(b.sentiment))
    .slice(0, 4);

  if (!quotes.length) return locale === "ko" ? "아직 이 데이터셋에서 quote 텍스트를 찾지 못했습니다." : "I do not see quote text in this dataset yet.";

  const title = locale === "ko" ? "쓸 만한 인용문" : "Useful quotes";
  return `${title}:\n${quotes
    .map((row, index) => `${index + 1}. "${row.quote}" - ${row.participant}, ${row.segment}, ${row.theme}, severity ${row.severity}`)
    .join("\n")}`;
}

function buildSentimentAnswer(metrics, locale = "en") {
  const strongest = metrics.bestSegment;
  const weakest = metrics.worstSegment;
  const counts = metrics.sentimentCounts;

  if (locale === "ko") {
    return [
      `감정 분포: 긍정 ${counts.positive}건, 중립 ${counts.neutral}건, 부정 ${counts.negative}건입니다.`,
      strongest ? `가장 강한 세그먼트: ${strongest.name} (평균 감정 ${strongest.avgSentiment.toFixed(2)}).` : "가장 강한 세그먼트: 아직 세그먼트 데이터가 충분하지 않습니다.",
      weakest ? `가장 약한 세그먼트: ${weakest.name} (평균 감정 ${weakest.avgSentiment.toFixed(2)}).` : "가장 약한 세그먼트: 아직 세그먼트 데이터가 충분하지 않습니다.",
    ].join("\n\n");
  }

  return [
    `Sentiment mix: ${counts.positive} positive, ${counts.neutral} neutral, ${counts.negative} negative.`,
    strongest ? `Strongest segment: ${strongest.name} (${strongest.avgSentiment.toFixed(2)} average sentiment).` : "Strongest segment: not enough segment data yet.",
    weakest ? `Weakest segment: ${weakest.name} (${weakest.avgSentiment.toFixed(2)} average sentiment).` : "Weakest segment: not enough segment data yet.",
  ].join("\n\n");
}

function buildDefaultAnswer(metrics, locale = "en") {
  if (locale === "ko") {
    return [
      "이 데이터셋은 몇 가지 방향으로 도와드릴 수 있습니다.",
      buildSummaryAnswer(metrics, "ko"),
      "예를 들어 어떤 이슈를 먼저 고칠지, quote를 뽑아달라고 하거나, 세그먼트별 감정 요약과 다음 액션을 물어볼 수 있습니다.",
    ].join("\n\n");
  }

  return ["I can help with this dataset from a few angles.", buildSummaryAnswer(metrics), "Try asking: which issue should we fix first, show quotes, summarize sentiment by segment, or recommend next actions."].join("\n\n");
}

function matchesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function formatAgentText(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function emptyState() {
  return `<div class="empty-state">No data available for the current view.</div>`;
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
