import * as functions from "firebase-functions";
import collections from "../constants/collections";
import * as _ from "lodash";
import { getUserById } from "../utils/user_utils";
import { NotificationDto } from "../models/notification.dto";
import { NotificationTypes } from "../enums/notification_types_enum";
const moment = require("moment");

export const chatMessagesService = function (
	adminDb: FirebaseFirestore.Firestore
) {
	const onChatMessageCreation = () =>
		functions.firestore
			.document(`${collections.chatMessages}/{chatMessageId}`)
			.onCreate(async (snapshot, context) => {
				const chatId = snapshot.get("chatId");

				try {
					await adminDb
						.collection(collections.chats)
						.doc(chatId)
						.set(
							{
								lastMessage: snapshot.data(),
								updatedAt: moment.utc(new Date()).valueOf(),
							},
							{ merge: true }
						);
				} catch (e) {
					console.error("error", e);
				}
			});

	const onChatMessageWrite = () =>
		functions.firestore
			.document(`${collections.chatMessages}/{chatMessageId}`)
			.onWrite(async (snapshot, context) => {
				try {
					// const previousItemSnapshot = snapshot.before;
					const currentItemSnapshot = snapshot.after;

					if (!currentItemSnapshot.exists) {
						// it"s a delete action
						return;
					}

					const chatId = currentItemSnapshot.get("chatId");

					await adminDb
						.collection(collections.chats)
						.doc(chatId)
						.set(
							{
								lastMessage: currentItemSnapshot.data(),
								updatedAt: moment.utc(new Date()).valueOf(),
							},
							{ merge: true }
						);

					const senderId = currentItemSnapshot.get("senderId");
					const receiverId = currentItemSnapshot.get("receiverId");

					const sender = await getUserById(senderId, adminDb);
					const receiver = await getUserById(receiverId, adminDb);

					if (!_.isNil(sender)) {
						await adminDb
							.collection(collections.notifications)
							.doc()
							.create(
								new NotificationDto(
									receiver.get("email"),
									NotificationTypes.NewMessage,
									{
										senderName: `${sender.get("firstname")} ${sender.get(
											"lastname"
										)}`,
									}
								).toObject()
							);
					}
				} catch (e) {
					console.error("error", e);
				}
			});

	return {
		onChatMessageWrite,
		onChatMessageCreation,
	};
};
