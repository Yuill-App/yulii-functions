import * as functions from "firebase-functions";
const Bottleneck = require("bottleneck");
import collections from "../constants/collections";
import * as _ from "lodash";
import { getUserById, displayName } from "../utils/user_utils";
import { NotificationDto } from "../models/notification.dto";
import { NotificationTypes } from "../enums/notification_types_enum";
import { Statuses } from "../enums/statuses_enum";

export const goalsService = function (adminDb: FirebaseFirestore.Firestore) {
	const onGoalCreation = () =>
		functions.firestore
			.document(`${collections.goals}/{goalId}`)
			.onCreate(async (snapshot, context) => {
				const assignees = snapshot.get("assignees");
				const referers = snapshot.get("referer");
				const tasksIds = snapshot.get("tasksIds");

				console.log("goals assignees", JSON.stringify(assignees, null, 2));

				if (_.isArray(assignees) && assignees.length > 0) {
					const author = await getUserById(snapshot.get("authorId"), adminDb);

					const isSuggestion = _.isArray(referers) && referers[0] !== author.id;

					console.log("is suggestion", isSuggestion);

					const batch = adminDb.batch();

					const notificationsRef = adminDb
						.collection(collections.notifications)
						.doc();

					const futures = assignees
						.filter((assigneeId) => assigneeId !== author.id)
						.map(async (assigneeId) => {
							const assigneeUserDoc = await getUserById(assigneeId, adminDb);

							batch.create(
								notificationsRef,
								new NotificationDto(
									assigneeUserDoc.get("email"),
									NotificationTypes.GoalCreated,
									{
										sender: author.id,
										senderName: displayName(author),
										itemName: snapshot.get("name"),
										itemId: snapshot.id,
										itemStatus: snapshot.get("status"),
									}
								).toObject()
							);
						});

					if (isSuggestion) {
						const referer = await getUserById(referers[0], adminDb);

						await adminDb
							.collection(collections.notifications)
							.doc()
							.create(
								new NotificationDto(
									referer.get("email"),
									NotificationTypes.GoalSuggested,
									{
										sender: author.id,
										senderName: displayName(author),
										itemName: snapshot.get("name"),
										itemId: snapshot.id,
										itemStatus: snapshot.get("status"),
									}
								).toObject()
							);
					}

					await Promise.all(futures);
					const result = await batch.commit();

					console.log("write result", result);
				}
				if (_.isArray(tasksIds) && tasksIds.length > 0) {
					await updateLinkedTasks(tasksIds, snapshot.id);
				}
			});

	const onGoalUpdate = () =>
		functions.firestore
			.document(`${collections.goals}/{goalId}`)
			.onUpdate(async (snapshot, context) => {
				const currentItemSnapshot = snapshot.after;
				const author = await getUserById(currentItemSnapshot.get("authorId"), adminDb);
				const batch = adminDb.batch();
				const assignees = currentItemSnapshot.get("assignees");

				if (currentItemSnapshot.get("status") === Statuses.Pending) {
					const tasksIds = currentItemSnapshot.get("tasksIds");

					if (_.isArray(tasksIds) && tasksIds.length > 0) {
						await updateLinkedTasks(tasksIds, currentItemSnapshot.id);
					}

					if (_.isArray(assignees) && assignees.length > 0) {

					const notificationsRef = adminDb
						.collection(collections.notifications)
						.doc();

					const futures = assignees
						.filter((assigneeId) => assigneeId !== author.id)
						.map(async (assigneeId) => {
							const assigneeUserDoc = await getUserById(assigneeId, adminDb);

							batch.create(
								notificationsRef,
								new NotificationDto(
									assigneeUserDoc.get("email"),
									NotificationTypes.GoalAssigned,
									{
										sender: author.id,
										senderName: displayName(author),
										itemName: currentItemSnapshot.get("name"),
										itemId: currentItemSnapshot.id,
										itemStatus: currentItemSnapshot.get("status"),
									}
								).toObject()
							);
						});
						await Promise.all(futures);
						const result = await batch.commit();
						console.log("write result", result);
					}
				}
			});

	const updateLinkedTasks = async (tasksIds: string[], goalId: string) => {
		const limiter = new Bottleneck({ maxConcurrent: 5 });

		const tasksToRun = tasksIds.map((taskId) =>
			limiter.schedule(() =>
				adminDb.collection(collections.tasks).doc(taskId).update({ goalId })
			)
		);

		return Promise.all(tasksToRun);
	};

	return {
		onGoalCreation,
		onGoalUpdate,
	};
};
