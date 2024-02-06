import * as functions from "firebase-functions";
import collections from "../constants/collections";
import * as _ from "lodash";
import { getUserById, getUserByEmail } from "../utils/user_utils";
import { NotificationDto } from "./../models/notification.dto";
import { NotificationTypes } from "../enums/notification_types_enum";
import { Statuses } from "../enums/statuses_enum";
import { displayName } from "./../utils/user_utils";
// const moment = require("moment");

export const invitationsService = function (
	adminDb: FirebaseFirestore.Firestore
) {
	const onInvitationCreation = () =>
		functions.firestore
			.document(`${collections.invitations}/{invitationId}`)
			.onCreate(async (snapshot, context) => {
				const senderId = snapshot.get("sender");
				const receiverEmail = snapshot.get("receiver");

				const sender = await getUserById(senderId, adminDb);

				if (!_.isNil(sender)) {
					await adminDb
						.collection(collections.notifications)
						.doc()
						.create(
							new NotificationDto(receiverEmail, NotificationTypes.Invitation, {
								itemId: snapshot.id,
								sender: sender.id,
								senderName: `${sender.get("firstname")} ${sender.get(
									"lastname"
								)}`,
							}).toObject()
						);
				}
			});

	const onInvitationUpdate = () =>
		functions.firestore
			.document(`${collections.invitations}/{invitationId}`)
			.onUpdate(async (snapshot, context) => {
				try {
					const previousItemSnapshot = snapshot.before;
					const currentItemSnapshot = snapshot.after;

					if (
						previousItemSnapshot.get("status") !== currentItemSnapshot.get("status") 
						&&currentItemSnapshot.get("status") === Statuses.Done
					) {
						console.log("is done");
						const invitationReceiver = await getUserByEmail(
							currentItemSnapshot.get("receiver"),
							adminDb
						);
						const invitationSender = await getUserById(
							currentItemSnapshot.get("sender"),
							adminDb
						);

						if (!_.isNil(invitationReceiver)) {
							await adminDb
								.collection(collections.notifications)
								.doc()
								.create(
									new NotificationDto(
										invitationSender.get("email"),
										NotificationTypes.InvitationAccepted,
										{
											itemId: currentItemSnapshot.id,
											sender: invitationReceiver.id,
											senderName: displayName(invitationReceiver),
											receiverName: displayName(invitationSender),
										}
									).toObject()
								);
						}
					} else {
						console.log("not done");
					}
				} catch (e) {
					console.error("error", e);
				}
			});

	return {
		onInvitationCreation,
		onInvitationUpdate,
	};
};
