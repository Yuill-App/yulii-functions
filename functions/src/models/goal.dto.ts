import { GoalType } from "../enums/goal_type.enum";
import { Statuses } from "../enums/statuses_enum";
import * as _ from "lodash";

export class Goal {
	assignees: string[];
	authorId: string;
	createdAt: Date;
	description: string;
	duedate?: Date;
	goalType: GoalType;
	isMystery: boolean;
	name: string;
	points: number;
	referer: string[];
	status: Statuses;
	tasksIds?: string[];
	updatedAt: Date;

	constructor(
		assignees: string[],
		authordId: string,
		description: string,
		goalType: GoalType,
		isMystery: boolean,
		name: string,
		points: number,
		referer: string[],
		status: Statuses,
		updatedAt: Date = new Date(),
		createdAt: Date = new Date(),
		dueDate?: Date,
		tasksIds?: string[]
	) {
		this.assignees = assignees;
		this.authorId = authordId;
		this.description = description;
		this.goalType = goalType;
		this.isMystery = isMystery;
		this.name = name;
		this.points = points;
		this.referer = referer;
		this.status = status;
		this.updatedAt = updatedAt;
		this.createdAt = createdAt;

		if (!_.isNil(dueDate)) {
			this.duedate = dueDate;
		}
		if (!_.isNil(tasksIds)) {
			this.tasksIds = tasksIds;
		}
	}

	toObject(): GoalObject {
		return {
			assignees: this.assignees,
			authorId: this.authorId,
			description: this.description,
			goalType: this.goalType,
			isMystery: this.isMystery,
			name: this.name,
			points: this.points,
			referer: this.referer,
			status: this.status,
			updatedAt: this.updatedAt,
			createdAt: this.createdAt,
		};
	}
}

export interface GoalObject {
	assignees: string[];
	authorId: string;
	createdAt: Date;
	description: string;
	duedate?: Date;
	goalType: GoalType;
	isMystery: boolean;
	name: string;
	points: number;
	referer: string[];
	status: Statuses;
	tasksIds?: string[];
	updatedAt: Date;
}
