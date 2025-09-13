import { Schema, model, Document } from "mongoose";

export interface IClick extends Document {
	short_code: string;
	ip: string;
	user_agent: string;
	referrer?: string;
	location?: {
		city?: string;
		country?: string;
	};
	created_at: Date;
}

const clickSchema = new Schema<IClick>({
	short_code: { type: String, required: true },
	ip: { type: String, required: true },
	user_agent: { type: String, required: true },
	referrer: { type: String },
	location: {
		city: { type: String },
		country: { type: String },
	},
	created_at: { type: Date, default: Date.now },
});

export const Click = model<IClick>("Click", clickSchema);
