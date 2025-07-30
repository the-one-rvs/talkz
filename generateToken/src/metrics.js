import client from "prom-client";
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: "talkz_generateToken_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});
register.registerMetric(httpRequestCounter);

export const httpRequestDurationHistogram = new client.Histogram({
  name: "talkz_generateToken_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5] // Adjust based on app latency
});
register.registerMetric(httpRequestDurationHistogram);

export const tokenCreationDuration = new client.Histogram({
  name: "talkz_generateToken_token_creation_duration",
  help: "Just Counting Token Creation Time",
  buckets: [1, 5, 10, 50, 100, 250, 500]
})
register.registerMetric(tokenCreationDuration)

export const accessTokenCreateCounter = new client.Counter({
  name: "talkz_generateToken_access_token_total",
  help: "Times Access Token Created"
})
register.registerMetric(accessTokenCreateCounter)

export const refreshTokenCreateCounter = new client.Counter({
  name: "talkz_generateToken_refresh_token_total",
  help: "Times Access Token Created"
})
register.registerMetric(refreshTokenCreateCounter)

export const mongoOP = new client.Histogram({
  name: "talkz_generateToken_mongodb_operations_seconds",
  help: "Get the time of operations for db",
  buckets: [1, 5, 10, 50, 100, 250, 500],
  labelNames: ["operation", "type"]
})
register.registerMetric(mongoOP)

export const mongoDBConnect = new client.Histogram({
  name: "talkz_generateToken_mongodb_connection_duration_seconds",
  help: "MongoDB Connection Duration",
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 15]
})
register.registerMetric(mongoDBConnect)

export { register }