import client from "prom-client";
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: "talkz_register_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});
register.registerMetric(httpRequestCounter);

export const httpRequestDurationHistogram = new client.Histogram({
  name: "talkz_register_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5] // Adjust based on app latency
});
register.registerMetric(httpRequestDurationHistogram);

export const registerSuccessCounter = new client.Counter({
  name: "talkz_register_register_success_total",
  help: "Number of successful user Registers",
});
register.registerMetric(registerSuccessCounter);

export const registerDurationSeconds = new client.Histogram({
    name: "talkz_register_register_duration_seconds",
    help: "Summary of Register Duration",
    buckets: [5, 10, 50, 100, 150, 250, 500]
});
register.registerMetric(registerDurationSeconds);


export const mongoOP = new client.Histogram({
  name: "talkz_register_mongodb_operations_seconds",
  help: "Get the time of operations for db",
  buckets: [1, 5, 10, 50, 100, 250, 500],
  labelNames: ["operation", "type"]
})
register.registerMetric(mongoOP)

export const mongoDBConnect = new client.Histogram({
  name: "talkz_register_mongo_connection",
  help: "Duration of Mongo Connections",
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10, 50]
})
register.registerMetric(mongoDBConnect)

export { register }