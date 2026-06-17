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

export function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();

  res.on("finish", () => {
    const route = req.route?.path || req.path;

    const labels = {
      method: req.method,
      route,
      status: res.statusCode,
    };
 
    httpRequests.inc(labels);

    end(labels);
  });

  next();
}

export async function metricsHandler(req, res) {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
}
