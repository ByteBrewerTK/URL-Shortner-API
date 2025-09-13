import { Request, Response } from "express";

export const keepAlive = (_req: Request, res: Response) => {
	res.status(200).json({
		status: "ok",
		message: "API is alive",
		timestamp: new Date().toISOString(),
	});
};
