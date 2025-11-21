import Redis from "ioredis";

//Remember to set redis eviction policy for fullfillmemt of memory
// steps -->
// .) redis-cli
// .) CONFIG SET maxmemory 100mb #(100mb is the maximum memory)
// .) CONFIG SET maxmemory-policy allkeys-lru #(this is eviction policy from which the key which is not used evicted)
// const redis = new Redis({
//   host: process.env.REDIS_HOST,      // e.g. redis-17199.c80.us-east-1-2.ec2.redns.redis-cloud.com
//   port: process.env.REDIS_PORT,      // e.g. 17199
//   // username: "default",
//   // password: process.env.REDIS_PASSWORD, 
//   // tls: {} // Redis Cloud requires TLS
// });

const redis = new Redis({
  host: process.env.REDIS_IP, // or your Redis server address
  port: process.env.REDIS_PORT,
});

redis.on("connect", () => console.log("🔗 Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

export default redis;