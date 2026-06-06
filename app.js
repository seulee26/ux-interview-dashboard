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
