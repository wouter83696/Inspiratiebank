#!/usr/bin/env node

const fs = require("node:fs");

const mode = process.argv[2] || "decide";
const schedule = process.env.GITHUB_EVENT_SCHEDULE || "";
const eventName = process.env.GITHUB_EVENT_NAME || "";
const outputPath = process.env.GITHUB_OUTPUT || "";
const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const table = process.env.SUPABASE_TABLE || "bcjn_state";
const stateId = process.env.SUPABASE_STATE_ID || "bcjn-zomer-2026";
const fixedCheckSchedule = "31 6,13 * * 1-5";
const requestPollSchedule = "*/30 6-18 * * 1-5";
const dutchTimeZone = "Europe/Amsterdam";
const catchUpWindows = [
  { name: "ochtendplanning", startMinute: 8 * 60 + 45, endMinute: 10 * 60 + 30 },
  { name: "middagplanning", startMinute: 15 * 60 + 45, endMinute: 17 * 60 + 30 },
];

function writeOutput(values = {}) {
  if (!outputPath) return;
  const lines = Object.entries(values).map(([name, value]) => `${name}=${String(value)}`);
  fs.appendFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

function normalizeStorage(value = {}) {
  return {
    ...value,
    agendaSourceCheckRequestedAt: typeof value.agendaSourceCheckRequestedAt === "string" ? value.agendaSourceCheckRequestedAt : "",
    agendaSourceCheckStartedAt: typeof value.agendaSourceCheckStartedAt === "string" ? value.agendaSourceCheckStartedAt : "",
    agendaSourceCheckCompletedAt: typeof value.agendaSourceCheckCompletedAt === "string" ? value.agendaSourceCheckCompletedAt : "",
    agendaSourceCheckStatus: typeof value.agendaSourceCheckStatus === "string" ? value.agendaSourceCheckStatus : "",
    agendaSourceCheckMessage: typeof value.agendaSourceCheckMessage === "string" ? value.agendaSourceCheckMessage : "",
  };
}

function timeOf(value = "") {
  const time = new Date(value || "").getTime();
  return Number.isFinite(time) ? time : 0;
}

function dutchDateParts(date) {
  const parts = new Intl.DateTimeFormat("nl-NL", {
    timeZone: dutchTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    minuteOfDay: Number(values.hour) * 60 + Number(values.minute),
  };
}

function latestStoredSourceCheck(storage = {}) {
  return storage.sourceCheck?.lastCheckedAt || storage.sourceReview?.generatedAt || "";
}

function catchUpCheckReason(storage = {}, now = new Date()) {
  if (eventName !== "schedule" || schedule !== requestPollSchedule) return "";
  const nowParts = dutchDateParts(now);
  const activeWindow = catchUpWindows.find(
    (window) => nowParts.minuteOfDay >= window.startMinute && nowParts.minuteOfDay <= window.endMinute,
  );
  if (!activeWindow) return "";

  const lastCheckedAt = latestStoredSourceCheck(storage);
  const lastCheckedTime = timeOf(lastCheckedAt);
  if (!lastCheckedTime || lastCheckedTime > now.getTime()) return activeWindow.name;

  const lastParts = dutchDateParts(new Date(lastCheckedTime));
  const alreadyCheckedThisWindow =
    lastParts.dateKey === nowParts.dateKey && lastParts.minuteOfDay >= activeWindow.startMinute;
  return alreadyCheckedThisWindow ? "" : activeWindow.name;
}

async function supabaseFetch(pathname, options = {}) {
  if (!url || !key) throw new Error("Online opslag is niet ingesteld voor agenda-checks.");
  const base = url.replace(/\/+$/, "");
  const response = await fetch(`${base}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase gaf status ${response.status}: ${await response.text()}`);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function loadStorage() {
  const rows = await supabaseFetch(`${table}?id=eq.${encodeURIComponent(stateId)}&select=data`);
  return normalizeStorage(Array.isArray(rows) && rows[0]?.data ? rows[0].data : {});
}

async function saveStorage(storage) {
  const next = normalizeStorage({
    ...storage,
    updatedAt: new Date().toISOString(),
  });
  await supabaseFetch(`${table}?id=eq.${encodeURIComponent(stateId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ data: next, updated_at: next.updatedAt }),
  });
}

async function decide() {
  if (eventName === "workflow_dispatch" || eventName === "push" || schedule === fixedCheckSchedule) {
    const reason =
      eventName === "workflow_dispatch"
        ? "handmatig gestart"
        : eventName === "push"
          ? "wijziging gepubliceerd"
          : "vaste planning";
    writeOutput({ should_run: "true", reason });
    return;
  }

  let storage;
  try {
    storage = await loadStorage();
  } catch (error) {
    console.log(error.message);
    writeOutput({ should_run: "false", reason: "geen online opslag" });
    return;
  }

  const requestedAt = storage.agendaSourceCheckRequestedAt || "";
  const requestedTime = timeOf(requestedAt);
  const completedTime = timeOf(storage.agendaSourceCheckCompletedAt);
  const startedTime = timeOf(storage.agendaSourceCheckStartedAt);
  const runningStale = startedTime > 0 && Date.now() - startedTime > 45 * 60 * 1000;
  const hasPendingRequest = requestedTime > completedTime && (requestedTime > startedTime || runningStale);
  const catchUpReason = catchUpCheckReason(storage);

  if (catchUpReason) {
    console.log(`Agenda-check gestart via ${catchUpReason}; vorige check: ${latestStoredSourceCheck(storage) || "onbekend"}.`);
    writeOutput({ should_run: "true", reason: catchUpReason });
    return;
  }

  if (!hasPendingRequest) {
    console.log("Geen open agenda-checkverzoek.");
    writeOutput({ should_run: "false", reason: "geen verzoek" });
    return;
  }

  storage.agendaSourceCheckStartedAt = new Date().toISOString();
  storage.agendaSourceCheckStatus = "running";
  storage.agendaSourceCheckMessage = "Agenda-check wordt uitgevoerd.";
  await saveStorage(storage);
  console.log(`Agenda-checkverzoek gestart: ${requestedAt}`);
  writeOutput({ should_run: "true", reason: "siteverzoek", requested_at: requestedAt });
}

async function finish() {
  const status = process.env.CHECK_STATUS || "success";
  const success = status === "success";
  const storage = await loadStorage();
  const completedAt = new Date().toISOString();
  storage.agendaSourceCheckCompletedAt = completedAt;
  storage.agendaSourceCheckStatus = success ? "done" : "error";
  storage.agendaSourceCheckMessage = success
    ? `Agenda-check afgerond op ${completedAt}.`
    : `Agenda-check niet volledig afgerond op ${completedAt}.`;
  await saveStorage(storage);
  console.log(storage.agendaSourceCheckMessage);
}

(mode === "finish" ? finish() : decide()).catch((error) => {
  console.error(error.message);
  writeOutput({ should_run: "false", reason: "fout" });
  process.exitCode = 1;
});
