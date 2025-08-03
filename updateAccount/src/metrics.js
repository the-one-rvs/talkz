import client from "prom-client";
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: "talkz_updateService_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});
register.registerMetric(httpRequestCounter);

export const httpRequestDurationHistogram = new client.Histogram({
  name: "talkz_updateService_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5] // Adjust based on app latency
});
register.registerMetric(httpRequestDurationHistogram);

export const changePasswordCounter = new client.Counter({
  name: "talkz_updateService_pass_change_total",
  help: "Counts total password change"
})
register.registerMetric(changePasswordCounter);

export const updateAccCounter = new client.Counter({
  name: "talkz_updateService_account_update_total",
  help: "Counts total Accunt Update Attempts",
  labelNames: ["fullname", "username"]
})
register.registerMetric(updateAccCounter);

export const mongoOP = new client.Histogram({
  name: "talkz_updateService_mongodb_operations_seconds",
  help: "Get the time of operations for db",
  buckets: [1, 5, 10, 50, 100, 250, 500],
  labelNames: ["operation", "type"]
})
register.registerMetric(mongoOP)

export const mongoDBConnect = new client.Histogram({
  name: "talkz_updateService_mongodb_connection_duration_seconds",
  help: "MongoDB Connection Duration",
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 15]
})
register.registerMetric(mongoDBConnect)

export { register }