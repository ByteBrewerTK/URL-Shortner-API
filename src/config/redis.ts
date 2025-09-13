import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const redisClient = createClient({
	url: process.env.REDIS_URL,
	// reconnect automatically if disconnected
	socket: {
		reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
	},
});

redisClient.on("error", (err) => console.error("Redis error:", err));

redisClient
	.connect()
	.then(() => console.log("Connected to Redis"))
	.catch((err) => console.error("Redis connection error:", err));
