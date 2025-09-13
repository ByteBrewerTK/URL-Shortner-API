import { Request, Response } from "express";
import { Url } from "../models/Url.js";
import { Click } from "../models/Click.js";
import { generateShortCode } from "../utils/shortId.js";
import geoip from "geoip-lite";

export async function redirectUrl(req: Request, res: Response) {
	const { short_code } = req.params;

	const url = await Url.findOne({ short_code });
	if (!url) {
		return res.status(404).json({ error: "URL not found." });
	}

	if (url.expireAt && url.expireAt < new Date()) {
		return res.status(410).send("This link has expired");
	}

	const ip =
		req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
		req.connection.remoteAddress ||
		"";
	const user_agent = req.headers["user-agent"] || "";
	const referrer = req.get("Referrer") || req.get("Referer") || "";

	const geo = geoip.lookup(ip);

	const location = geo ? { city: geo.city, country: geo.country } : undefined;

	const click = new Click({
		short_code,
		ip,
		user_agent,
		referrer,
		location,
	});

	await click.save();

	url.click_count += 1;
	await url.save();

	res.redirect(url.long_url);
}

export async function shortenUrl(req: Request, res: Response) {
	const { long_url, expireAt } = req.body;

	if (!long_url) {
		return res.status(400).json({ error: "Long URL is required." });
	}

	const verdict = (req as any).urlVerdict;

	if (verdict === "malicious") {
		return res
			.status(400)
			.json({ error: "This URL is flagged as malicious." });
	}

	if (verdict === "suspicious") {
		return res
			.status(202)
			.json({ warning: "This URL may be unsafe. Proceed with caution." });
	}

	let short_code = generateShortCode();
	while (await Url.findOne({ short_code })) {
		short_code = generateShortCode();
	}

	const newUrl = new Url({
		short_code,
		long_url: long_url,
		expireAt: expireAt ? new Date(expireAt) : undefined,
	});

	await newUrl.save();

	res.json({
		short_url: `${process.env.BASE_URL}/${short_code}`,
		long_url: newUrl.long_url,
	});
}

export async function getAnalytics(req: Request, res: Response) {
	const { short_code } = req.params;

	const url = await Url.findOne({ short_code });
	if (!url) {
		return res.status(404).json({ error: "URL not found." });
	}

	const clicks = await Click.find({ short_code }).sort({ created_at: -1 });

	res.json({
		short_code,
		long_url: url.long_url,
		total_clicks: url.click_count,
		clicks: clicks.map((click) => ({
			ip: click.ip,
			user_agent: click.user_agent,
			referrer: click.referrer,
			location: click.location,
			timestamp: click.created_at,
		})),
	});
}
