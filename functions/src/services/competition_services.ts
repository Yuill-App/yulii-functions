import * as functions from "firebase-functions";
import collections from "../constants/collections";
import * as _ from "lodash";
import { NotificationDto } from "../models/notification.dto";
import { NotificationTypes } from "../enums/notification_types_enum";
import {
	getUserById,
	displayName,
} from "../utils/user_utils";
import { FieldValue } from "firebase-admin/firestore";
import { Statuses } from "../enums/statuses_enum";
const moment = require("moment");

export const competitionServices = function (adminDb: FirebaseFirestore.Firestore) {
	const onCompetitionCreation = () => functions.firestore
		.document(`${collections.competition}/{competitionId}`)
		.onCreate(async (snapshot, context) => {
			//	const batch = adminDb.batch();
			const taskAssignees = snapshot.get("assignees");
			const author = await getUserById(snapshot.get("authorId"), adminDb);
			const batch = adminDb.batch();
			const notificationsCollection = adminDb.collection(collections.notifications);


			console.log("competition assignees", JSON.stringify(taskAssignees, null, 2));

			for (const assigneeId of taskAssignees) {
				const assigneeUserDoc = await getUserById(assigneeId, adminDb);
				const notificationRef = notificationsCollection.doc();
				const notificationData = new NotificationDto(
					assigneeUserDoc.get("email"),
					NotificationTypes.CompetitionCreation,
					{
						itemId: snapshot.id,
						itemName: snapshot.get("name"),
						itemStatus: snapshot.get("status"),
						competitionDeal: snapshot.get("competitionDeals"),
						sender: author.id,
						senderName: displayName(author),
					}
				).toObject();

				batch.set(notificationRef, notificationData);
			}
			await batch.commit();

		});


	const onCompetitionUpdate = () =>
		functions.firestore
			.document(`${collections.competition}/{competitionId}`)
			.onUpdate(async (snapshot, context) => {
				try {
					//const previousItemSnapshot = snapshot.before;
					const currentItemSnapshot = snapshot.after;
					const batch = adminDb.batch();
					const author = await getUserById(currentItemSnapshot.get("authorId"), adminDb);
					const notificationsCollection = adminDb.collection(collections.notifications);
					const taskAssignees = currentItemSnapshot.get("assignees");


					for (const assigneeId of taskAssignees) {
						const assigneeUserDoc = await getUserById(assigneeId, adminDb);
						const notificationRef = notificationsCollection.doc();
						const notificationData = new NotificationDto(
							assigneeUserDoc.get("email"),
							NotificationTypes.CompetitionUpdate,
							{
								itemId: currentItemSnapshot.id,
								itemName: currentItemSnapshot.get("name"),
								itemStatus: currentItemSnapshot.get("status"),
								competitionDeal: currentItemSnapshot.get("competitionDeals"),
								sender: author.id,
								senderName: displayName(author),
							},
							currentItemSnapshot.get("status")
						).toObject();

						batch.set(notificationRef, notificationData);
					}
					await batch.commit();

				} catch (e) {
					console.error("error", e);
				}
			});

	const onCompetitionDealUpdate = () =>
		functions.firestore
			.document(`${collections.competitionDeal}/{competitionDealId}`)
			.onUpdate(async (snapshot, context) => {
				const currentItemSnapshot = snapshot.before;
				const afterItemSnapshot = snapshot.after;

				try {
					// Retrieve the competitionId from the snapshot
					const competitionId = currentItemSnapshot.get("competitionId");
					const status = afterItemSnapshot.get("status")

					// Reference to the specific document in the competitionDeal collection
					const competitionDealRef = adminDb.collection("competition").doc(competitionId);

					const doc = await competitionDealRef.get();
					const data = doc.data() || {};

					if (!("dealsDone" in data)) {
						await competitionDealRef.update({
							["dealsDone"]: 0
						});
					}

					// Update the document with the current UTC timestamp
					await competitionDealRef.update({
						updatedAt: moment.utc(new Date()).valueOf(),
						dealsDone: (status == Statuses.Done) ? FieldValue.increment(1) : FieldValue, // Replace 'yourFieldName' with the actual field name

					});

					const competitionDealRef2 = adminDb.collection("competition").doc(competitionId);
					const doc2 = await competitionDealRef2.get();

					if (doc2.exists) {
						await competitionDealRef.update({
							updatedAt: moment.utc(new Date()).valueOf(),
							status: ((doc2.get("dealsDone")) === doc2.get("competitionDeals").length) ?
								Statuses.Done :
								doc2.get("status")
						});
					}
					console.log(`Document doneDeals ${doc2.get("dealsDone")}`);
					console.log(`Document competitionDeals  ${doc2.get("competitionDeals")}`);
					console.log(`Document with competitionId ${competitionId} updated successfully.`);
				} catch (error) {
					console.error("Error updating document:", error);
				}


			});

	return {
		onCompetitionCreation,
		onCompetitionUpdate,
		onCompetitionDealUpdate
	};
};


