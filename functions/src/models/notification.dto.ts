import { NotificationTypes } from "../enums/notification_types_enum";
import { Statuses } from "../enums/statuses_enum";
const moment = require("moment");

export class NotificationDto {
	receiver: string;
	type: NotificationTypes;
	createdAt: Date;
	updatedAt: Date;
	status: Statuses;
	read: boolean;
	data: NotificationData;

	constructor(
		receiver: string,
		type: NotificationTypes,
		data: NotificationData,
		createdAt: Date = new Date(),
		updatedAt: Date = new Date(),
		status: Statuses = Statuses.Pending,
		read: boolean = false
	) {
		this.receiver = receiver;
		this.type = type;
		this.data = data;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.status = status;
		this.read = read;
	}

	toObject(): NotificationObject {
		return {
			receiver: this.receiver,
			type: this.type,
			data: this.data,
			createdAt: moment.utc(this.createdAt).valueOf(),
			updatedAt: moment.utc(this.updatedAt).valueOf(),
			status: this.status,
			read: this.read,
		};
	}
}

export interface NotificationData {
	sender?: string;
	senderName?: string;
	receiverName?: string;
	itemName?: string;
	itemId?: string;
	itemStatus?: Statuses;
}

export interface NotificationObject {
	receiver: string;
	type: NotificationTypes;
	data: NotificationData;
	createdAt: number;
	updatedAt: number;
	status: Statuses;
	read: boolean;
}
