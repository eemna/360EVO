import client from "prom-client";

client.collectDefaultMetrics({ prefix: "app_" });

export const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

export const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const rateLimitHits = new client.Counter({
  name: "rate_limit_hits_total",
  help: "Total requests blocked by rate limiter",
  labelNames: ["type"],
});

export const rateLimitRequests = new client.Counter({
  name: "rate_limit_requests_total",
  help: "Total requests checked by rate limiter",
  labelNames: ["type", "allowed"], 
});

export const cronJobRuns = new client.Counter({
  name: "cron_job_runs_total",
  help: "Total cron job executions",
  labelNames: ["job", "status"],
});

export const cronJobDuration = new client.Histogram({
  name: "cron_job_duration_seconds",
  help: "Cron job execution duration",
  labelNames: ["job"],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

export const cronMatchesUpdated = new client.Gauge({
  name: "cron_matches_updated_last_run",
  help: "Number of matches updated in last cron run",
});

export const cronNarrativesRetried = new client.Counter({
  name: "cron_narratives_retried_total",
  help: "Total failed narratives retried by cron",
});

export const llmCallsTotal = new client.Counter({
  name: "llm_calls_total",
  help: "Total LLM API calls",
  labelNames: ["service", "success"],
  // service: callLlm, runMixtureOfExperts, createThesisAlignment,
  //          createPitchAnalysis, createDocumentRiskScan,
  //          suggestQaAnswer, createDealBrief
});

export const llmCallDuration = new client.Histogram({
  name: "llm_call_duration_seconds",
  help: "LLM call response time",
  labelNames: ["service"],
  buckets: [0.5, 1, 2, 5, 10, 20, 30],
});

export const llmRetries = new client.Counter({
  name: "llm_retries_total",
  help: "Total LLM rate limit retries",
  labelNames: ["attempt"],
});

export const llmCacheHits = new client.Counter({
  name: "llm_cache_hits_total",
  help: "Total times LLM result served from cache",
  labelNames: ["type"], // THESIS_ALIGNMENT, DD_SUMMARY, etc.
});

export const ddRequestsTotal = new client.Counter({
  name: "dd_requests_total",
  help: "Total due diligence requests",
  labelNames: ["status"], // pending, approved, declined
});

export const activeDataRooms = new client.Gauge({
  name: "active_data_rooms_total",
  help: "Currently active data rooms",
});

export const ddDocumentsUploaded = new client.Counter({
  name: "dd_documents_uploaded_total",
  help: "Total documents uploaded to data rooms",
});

export const ddAiScansTotal = new client.Counter({
  name: "dd_ai_scans_total",
  help: "Total AI document scans run",
  labelNames: ["cached"], // 'true' or 'false'
});

export const ddQaThreadsTotal = new client.Counter({
  name: "dd_qa_threads_total",
  help: "Total Q&A threads created in data rooms",
});

export const ddDealBriefsTotal = new client.Counter({
  name: "dd_deal_briefs_total",
  help: "Total deal briefs generated",
});

export const bookingsTotal = new client.Counter({
  name: "bookings_total",
  help: "Total consultation bookings",
  labelNames: ["status"], // pending, accepted, declined, cancelled
});

export const paymentsTotal = new client.Counter({
  name: "payments_total",
  help: "Total payments processed",
  labelNames: ["type", "status"], // type: EVENT or CONSULTATION
});

export const matchesGenerated = new client.Counter({
  name: "matches_generated_total",
  help: "Total AI matches generated",
});

export const matchScoreHistogram = new client.Histogram({
  name: "match_score_distribution",
  help: "Distribution of match scores",
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
});

export function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on("finish", () => {
    const route = req.route?.path || req.path;
    const labels = { method: req.method, route, status: res.statusCode };
    httpRequests.inc(labels);
    end(labels);
  });
  next();
}

export async function metricsHandler(req, res) {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
}
