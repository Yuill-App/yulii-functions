import * as functions from "firebase-functions";
import collections from "../constants/collections";
import * as _ from "lodash";
import { NotificationDto } from "../models/notification.dto";
import { NotificationTypes } from "../enums/notification_types_enum";
import {
	getUserById,
	getLastCreditTransaction,
	displayName,
} from "../utils/user_utils";
import { Statuses } from "../enums/statuses_enum";
import { CreditTransactionTypes } from "../enums/credit_transaction_types_enum";
const moment = require("moment");

export const tasksServices = function (adminDb: FirebaseFirestore.Firestore) {
	const onTaskCreation = () =>
		functions.firestore
			.document(`${collections.tasks}/{taskId}`)
			.onCreate(async (snapshot, context) => {
				const taskAssignees = snapshot.get("assignees");

				console.log("task assignees", JSON.stringify(taskAssignees, null, 2));

				if (_.isArray(taskAssignees) && taskAssignees.length > 0) {
					const userDoc = await getUserById(snapshot.get("authorId"), adminDb);
					const batch = adminDb.batch();

					const notificationsRef = adminDb
						.collection(collections.notifications)
						.doc();

					const futures = taskAssignees.map(async (assigneeId) => {
						const assigneeUserDoc = await getUserById(assigneeId, adminDb);

						batch.create(
							notificationsRef,
							new NotificationDto(
								assigneeUserDoc.get("email"),
								NotificationTypes.TaskCreated,
								{
									sender: userDoc.id,
									senderName: `${userDoc.get("firstname")} ${userDoc.get(
										"lastname"
									)}`,
									itemName: snapshot.get("name"),
									itemId: snapshot.id,
									itemStatus: snapshot.get("status"),
								}
							).toObject()
						);
					});

					await Promise.all(futures);

					const result = await batch.commit();

					console.log("write result", result);
				}
			});

	const onTaskUpdate = () =>
		functions.firestore
			.document(`${collections.tasks}/{taskId}`)
			.onUpdate(async (snapshot, context) => {
				try {
					const previousItemSnapshot = snapshot.before;
					const currentItemSnapshot = snapshot.after;
					const taskAssignees = currentItemSnapshot.get("assignees");

					if (
						_.isArray(taskAssignees) 
						&&taskAssignees.length > 0 
						&&previousItemSnapshot.get("status") !== currentItemSnapshot.get("status")
					) {
						const assignee = await getUserById(taskAssignees[0], adminDb);
						const author = await getUserById(
							currentItemSnapshot.get("authorId"),
							adminDb
						);

						if (currentItemSnapshot.get("status") === Statuses.Done) {
							await adminDb
								.collection(collections.notifications)
								.doc()
								.create(
									new NotificationDto(
										assignee.get("email"),
										NotificationTypes.TaskStatusChanged,
										{
											itemId: currentItemSnapshot.id,
											itemName: currentItemSnapshot.get("name"),
											itemStatus: currentItemSnapshot.get("status"),
											sender: author.id,
											senderName: displayName(author),
										}
									).toObject()
								);
						} else if (
							currentItemSnapshot.get("status") === Statuses.Pending
							) {
							await adminDb
								.collection(collections.notifications)
								.doc()
								.create(
									new NotificationDto(
										author.get("email"),
										NotificationTypes.TaskStatusChanged,
										{
											itemId: currentItemSnapshot.id,
											itemName: currentItemSnapshot.get("name"),
											itemStatus: currentItemSnapshot.get("status"),
											sender: assignee.id,
											senderName: displayName(assignee),
										}
									).toObject()
								);
						} else if (
							currentItemSnapshot.get("status") === Statuses.Completed
							) {
							await adminDb
								.collection(collections.notifications)
								.doc()
								.create(
									new NotificationDto(
										author.get("email"),
										NotificationTypes.TaskStatusChanged,
										{
											itemId: currentItemSnapshot.id,
											itemName: currentItemSnapshot.get("name"),
											itemStatus: currentItemSnapshot.get("status"),
											sender: assignee.id,
											senderName: displayName(assignee),
										}
									).toObject()
								);
						} else if (
							currentItemSnapshot.get("status") === Statuses.Todo
							) {
							await adminDb
								.collection(collections.notifications)
								.doc()
								.create(
									new NotificationDto(
										author.get("email"),
										NotificationTypes.TaskStatusChanged,
										{
											itemId: currentItemSnapshot.id,
											itemName: currentItemSnapshot.get("name"),
											itemStatus: currentItemSnapshot.get("status"),
											sender: assignee.id,
											senderName: displayName(assignee),
										}
									).toObject()
								);
						}else if (
							currentItemSnapshot.get("status") === Statuses.Rejected
							) {
							await adminDb
								.collection(collections.notifications)
								.doc()
								.create(
									new NotificationDto(
										author.get("email"),
										NotificationTypes.TaskStatusChanged,
										{
											itemId: currentItemSnapshot.id,
											itemName: currentItemSnapshot.get("name"),
											itemStatus: currentItemSnapshot.get("status"),
											sender: assignee.id,
											senderName: displayName(assignee),
										}
									).toObject()
								);
						}
					
						if (currentItemSnapshot.get("status") === Statuses.Done) {
							// task is done, assignees must receive their credits
							const lastTransaction = await getLastCreditTransaction(
								assignee.id,
								adminDb
							);

							const previous = !_.isNil(lastTransaction)
								? lastTransaction.get("current")
								: 0;
							const transactionValue = currentItemSnapshot.get("points");
							const current = previous + transactionValue;

							const newCreditTransactionData = {
								previous: previous,
								taskName:currentItemSnapshot.get("name"),
								taskType:"deal",
								status:currentItemSnapshot.get("status"),
								transactionValue: transactionValue,
								current: current,
								transactionType: CreditTransactionTypes.Increase,
								ownerId: assignee.id,
								createdAt: moment.utc(new Date()).valueOf(),
							};

							await adminDb
								.collection(collections.creditTransactions)
								.doc()
								.create(newCreditTransactionData);
						}
					}
				} catch (e) {
					console.error("error", e);
				}
			});

	return {
		onTaskCreation,
		onTaskUpdate,
	};
};
