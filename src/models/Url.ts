import { Schema, model, Document } from "mongoose";

export interface IUrl extends Document {
	short_code: string;
	long_url: string;
	created_at: Date;
	click_count: number;
	expireAt: Date;
}

const urlSchema = new Schema<IUrl>({
	short_code: { type: String, required: true, unique: true },
	long_url: { type: String, required: true },
	created_at: { type: Date, default: Date.now },
	click_count: { type: Number, default: 0 },
	expireAt: { type: Date },
});
urlSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const Url = model<IUrl>("Url", urlSchema);
