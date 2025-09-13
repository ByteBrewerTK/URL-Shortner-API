import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis.js";
import { axiosInstance } from "../config/axios.js";

async function queryGoogleSafeBrowsing(
	longUrl: string
): Promise<"malicious" | "clean" | "unknown"> {
	const apiKey = process.env.GOOGLE_SAFEBROWSING_API_KEY;
	if (!apiKey) return "unknown";

	const body = {
		client: { clientId: "your-app", clientVersion: "1.0" },
		threatInfo: {
			threatTypes: [
				"MALWARE",
				"SOCIAL_ENGINEERING",
				"UNWANTED_SOFTWARE",
				"POTENTIALLY_HARMFUL_APPLICATION",
			],
			platformTypes: ["ANY_PLATFORM"],
			threatEntryTypes: ["URL"],
			threatEntries: [{ url: longUrl }],
		},
	};

	try {
		const res = await axiosInstance.post(
			`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
			body
		);
		return res.data && res.data.matches ? "malicious" : "clean";
	} catch (error) {
		console.error("Google Safe Browsing API error:", error);
		return "unknown";
	}
}

async function queryVirusTotal(
	longUrl: string
): Promise<"malicious" | "clean" | "unknown"> {
	const apiKey = process.env.VIRUSTOTAL_API_KEY;
	if (!apiKey) return "unknown";

	try {
		const encoded = Buffer.from(longUrl)
			.toString("base64")
			.replace(/=+$/, "");
		const res = await axiosInstance.get(
			`https://www.virustotal.com/api/v3/urls/${encoded}`,
			{ headers: { "x-apikey": apiKey } }
		);

		const positives =
			res.data?.data?.attributes?.last_analysis_stats?.malicious || 0;
		return positives > 0 ? "malicious" : "clean";
	} catch (error) {
		console.error("VirusTotal API error:", error);
		return "unknown";
	}
}

export async function riskCheckMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
) {
	console.log("inside middleware");
	const url = req.method === "POST" ? req.body.long_url : req.params.url;
	if (!url) return res.status(400).json({ error: "URL is required" });

	const normalizedUrl = url.toLowerCase();
	const cacheKey = `url_verdict:${normalizedUrl}`;

	try {
		const cachedVerdict = await redisClient.get(cacheKey);
		if (cachedVerdict) {
			(req as any).urlVerdict = cachedVerdict;
			return next();
		}

		const [gsbResult, vtResult] = await Promise.all([
			queryGoogleSafeBrowsing(normalizedUrl),
			queryVirusTotal(normalizedUrl),
		]);

		let verdict: "malicious" | "suspicious" | "clean" = "clean";
		const results = [gsbResult, vtResult];

		if (results.includes("malicious")) {
			verdict = "malicious";
		} else if (results.includes("unknown")) {
			verdict = "suspicious";
		}

		await redisClient.set(cacheKey, verdict, { EX: 60 * 60 * 24 }); // cache for 24h

		(req as any).urlVerdict = verdict;
		next();
	} catch (error) {
		console.error("Risk check middleware error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}
