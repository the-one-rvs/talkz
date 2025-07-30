import client from "prom-client";
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: "talkz_gateway_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});
register.registerMetric(httpRequestCounter);

export const httpRequestDurationHistogram = new client.Histogram({
  name: "talkz_gateway_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5] // Adjust based on app latency
});
register.registerMetric(httpRequestDurationHistogram);

export const cookieCounter = new client.Counter({
  name:"talkz_gateway_cookies_creation_total",
  help: "How Many Times Cookies Created"
});
register.registerMetric(cookieCounter)

export const cookieTimer = new client.Histogram({
  name:"talkz_gateway_cookies_creation_seconds",
  help: "Time Taken To Create Cookie",
  buckets: [1,2,5,10,50]
});
register.registerMetric(cookieTimer)

export const mongoOP = new client.Histogram({
  name: "talkz_gateway_mongodb_operations_seconds",
  help: "Get the time of operations for db",
  buckets: [1, 5, 10, 50, 100, 250, 500],
  labelNames: ["operation", "type"]
})
register.registerMetric(mongoOP)

export const mongoDBConnect = new client.Histogram({
  name: "talkz_gateway_mongo_connection",
  help: "Duration of Mongo Connections",
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10, 50]
})
register.registerMetric(mongoDBConnect)

export { register }