import { GoalType } from "../enums/goal_type.enum";
const moment = require("moment");

export class Claim {
	authorId: string;
	createdAt: Date;
	goalId: string;
	goalType: GoalType;
	points: number;

	constructor(
		authorId: string,
		goalId: string,
		goalType: GoalType,
		createdAt: Date = new Date(),
		points: number = 0
	) {
		this.authorId = authorId;
		this.createdAt = createdAt;
		this.goalId = goalId;
		this.goalType = goalType;
		this.points = points;
	}

	toObject(): ClaimObject {
		return {
			authorId: this.authorId,
			createdAt: moment.utc(this.createdAt).valueOf(),
			goalId: this.goalId,
			goalType: this.goalType,
			points: this.points,
		};
	}

	static fromObject(data: ClaimObject): Claim {
		console.log("claim object", data);
		return new Claim(
			data.authorId,
			data.goalId,
			data.goalType,
			moment(data.createdAt).toDate(),
			data.points
		);
	}

	public toString(): string {
		return `Claim ( 
              authordId: ${this.authorId} 
              goalId: ${this.goalId}
              goalType: ${this.goalType}
              points: ${this.points}
              createdAt: ${this.createdAt}
            )`;
	}
}

export interface ClaimObject {
	authorId: string;
	createdAt: number;
	goalId: string;
	goalType: GoalType;
	points: number;
}
