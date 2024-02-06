import collections from "../constants/collections";
import { messaging, firestore } from "firebase-admin";
import { getUserByEmail } from "./../utils/user_utils";
import * as _ from "lodash";
//import { Statuses } from "../enums/statuses_enum";
//import { getCellValue } from "./google_sheets_service";

const toValue: any = (field: any) => {
	return "integerValue" in field
		? Number(field.integerValue)
		: "doubleValue" in field
			? Number(field.doubleValue)
			: "arrayValue" in field
				? field.arrayValue.values.map(toValue)
				: "mapValue" in field
					? toJSON(field.mapValue)
					: "booleanValue" in field
						? Boolean(field.booleanValue)
						: "stringValue" in field
							? String(field.stringValue)

							: Object.entries(field)[0][1];
}

const toJSON: any = (doc: any) => {
	return Object.fromEntries(
		Object.entries(doc.fields ?? {}).map(([key, field]) => [key, toValue(field)])
	);
}

export const handleAcceptedInvitationNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	try {
		const receiver = await getUserByEmail(
			notificationSnapshot.get("receiver"),
			db
		);

		if (receiver !== null) {
			await Promise.all([
				db
					.collection(collections.users)
					.doc(notificationSnapshot.get("data")["sender"])
					.update({
						friends: firestore.FieldValue.arrayUnion(receiver.get("remoteId")),
					}),
				db
					.collection(collections.users)
					.doc(receiver.get("remoteId"))
					.update({
						friends: firestore.FieldValue.arrayUnion(
							notificationSnapshot.get("data")["sender"]
						),
					}),
			]);

			const clients = await db
				.collection(collections.users)
				.doc(receiver.id)
				//.collection(collections.clients)
				.get();

			if (notificationSnapshot.get("type") === "invitation_accepted") {
				const englishPayload: messaging.MessagingPayload = {
					notification: {
						title: "Friend requested accepted",
						body: notificationSnapshot.get("data")["senderName"] + " has accepted your friend request",
						clickAction: "FLUTTER_NOTIFICATION_CLICK",
					},
					data: {
						"data": JSON.stringify(notificationSnapshot.get("data")),
						"type": notificationSnapshot.get("type")
					}
				};
				const token = clients.get("device")["token"]
				await fcm.sendToDevice([token], englishPayload);
			}

			if (notificationSnapshot.get("type") === "invitation") {
				const englishPayload: messaging.MessagingPayload = {
					notification: {
						title: "New friend request",
						body: notificationSnapshot.get("data")["senderName"] + " just sent you a friend request",
						clickAction: "FLUTTER_NOTIFICATION_CLICK",
					},
					data: {
						"data": JSON.stringify(notificationSnapshot.get("data")),
						"type": notificationSnapshot.get("type")
					}
				};
				const token = clients.get("device")["token"]
				await fcm.sendToDevice([token], englishPayload);
			}

			/* 	if (clients.size > 0) {
					// const tokens = clients.docs.map((client) => client.get("token"));
					const frenchLanguageEnabledClientTokens = clients.docs.filter(client => client.get("language") === "fr").map(client => client.get("token"));
					const englishLanguageEnabledClientTokens = clients.docs.filter(client => client.get("language") !== "fr").map(client => client.get("token"));
	
					if (englishLanguageEnabledClientTokens.length > 0) {
						const englishPayload: messaging.MessagingPayload = {
							notification: {
								title: await getCellValue("notifications.invitationAccepted.title", "en"),
								body: await getCellValue("notifications.invitationAccepted.body", "en", { key: "{{user}}", value: notificationSnapshot.get("data")["senderName"] }),
								clickAction: "FLUTTER_NOTIFICATION_CLICK",
							},
						};
	
						await fcm.sendToDevice(englishLanguageEnabledClientTokens, englishPayload);
					}
					if (frenchLanguageEnabledClientTokens.length > 0) {
						const frenchPayload: messaging.MessagingPayload = {
							notification: {
								title: await getCellValue("notifications.invitationAccepted.title", "fr"),
								body: await getCellValue("notifications.invitationAccepted.body", "fr", { key: "{{user}}", value: notificationSnapshot.get("data")["senderName"] }),
								clickAction: "FLUTTER_NOTIFICATION_CLICK",
							},
						};
	
						await fcm.sendToDevice(frenchLanguageEnabledClientTokens, frenchPayload);
					}
				} */
		}
	} catch (e) {
		throw e;
	}
};

export const handleInvitationNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	try {
		const receiverUserQueryResult = await db
			.collection(collections.users)
			.where("email", "==", notificationSnapshot.get("receiver"))
			.limit(1)
			.get();

		if (receiverUserQueryResult.size > 0) {
			const receiver = await receiverUserQueryResult.docs[0].ref.get();
			/* 
						const sender = await db
							.collection(collections.users)
							.doc(notificationSnapshot.get("data")["sender"])
							.get(); */

			const clients = await db
				.collection(collections.users)
				.doc(receiver.get("remoteId"))
				//.collection(collections.clients)
				.get();

			if (notificationSnapshot.get("type") === "invitation_accepted") {
				const englishPayload: messaging.MessagingPayload = {
					notification: {
						title: "Friend requested accepted",
						body: notificationSnapshot.get("data")["senderName"] + " has accepted your friend request",
						clickAction: "FLUTTER_NOTIFICATION_CLICK",
					},
					data: {
						"data": JSON.stringify(notificationSnapshot.get("data")),
						"type": notificationSnapshot.get("type")
					}
				};
				const token = clients.get("device")["token"]
				await fcm.sendToDevice([token], englishPayload);
			}

			if (notificationSnapshot.get("type") === "invitation") {
				const englishPayload: messaging.MessagingPayload = {
					notification: {
						title: "New friend request",
						body: notificationSnapshot.get("data")["senderName"] + " just sent you a friend request",
						clickAction: "FLUTTER_NOTIFICATION_CLICK",
					},
					data: {
						"data": JSON.stringify(notificationSnapshot.get("data")),
						"type": notificationSnapshot.get("type")
					}
				};
				const token = clients.get("device")["token"]
				await fcm.sendToDevice([token], englishPayload);
			}

			/* if (clients.size > 0) {
				const frenchLanguageEnabledClientTokens = clients.docs.filter(client => client.get("language") === "fr").map(client => client.get("token"));
				const englishLanguageEnabledClientTokens = clients.docs.filter(client => client.get("language") !== "fr").map(client => client.get("token"));

				if (englishLanguageEnabledClientTokens.length > 0) {
					const englishPayload: messaging.MessagingPayload = {
						notification: {
							title: await getCellValue("notifications.invitation.title", "en"),
							body: await getCellValue("notifications.invitation.body", "en", { key: "{{user}}", value: sender.get("firstname") }),
							clickAction: "FLUTTER_NOTIFICATION_CLICK",
						},
					};

					await fcm.sendToDevice(englishLanguageEnabledClientTokens, englishPayload);
				}
				if (frenchLanguageEnabledClientTokens.length > 0) {
					const frenchPayload: messaging.MessagingPayload = {
						notification: {
							title: await getCellValue("notifications.invitation.title", "fr"),
							body: await getCellValue("notifications.invitation.body", "fr", { key: "{{user}}", value: sender.get("firstname") }),
							clickAction: "FLUTTER_NOTIFICATION_CLICK",
						},
					};

					await fcm.sendToDevice(frenchLanguageEnabledClientTokens, frenchPayload);
				}
			} */
		}
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const handleGoalCreatedNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	const receiver = await getUserByEmail(
		notificationSnapshot.get("receiver"),
		db
	);
	if (!_.isNil(receiver)) {
		const clients = await db
			.collection(collections.users)
			.doc(receiver.id)
			.get();


		await Promise.all([
			db
				.collection(collections.goals)
				.doc(notificationSnapshot.get("data")["itemId"])
				.update({
					remoteId: notificationSnapshot.get("data")["itemId"]
				})
		]);

		const rwardObj = await db
			.collection(collections.goals)
			.doc(notificationSnapshot.get("data")["itemId"])
			.get();
		//  Converting the firebase obkect to javascript object
		const rewardObjDocumentData2 = rwardObj.data() as FirebaseFirestore.DocumentData

		const englishPayload: messaging.MessagingPayload = {
			notification: {
				title: notificationSnapshot.get("data")["senderName"] + " assigned a reward for you",
				body: notificationSnapshot.get("data")["itemName"],
				clickAction: "FLUTTER_NOTIFICATION_CLICK",
			},
			data: {
				"data": JSON.stringify(rewardObjDocumentData2),
				"type": notificationSnapshot.get("type")
			}
		};
		const token = clients.get("device")["token"]
		await fcm.sendToDevice([token], englishPayload);
	}
};

export const handleGoalSuggestedNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	const receiver = await getUserByEmail(
		notificationSnapshot.get("receiver"),
		db
	);

	if (!_.isNil(receiver)) {
		const clients = await db
			.collection(collections.users)
			.doc(receiver.id)
			.get();

		const dealObj = await db
			.collection(collections.goals)
			.doc(notificationSnapshot.get("data")["itemId"])
			.get();
		//  Converting the firebase obkect to javascript object
		const rewardObjDocumentData2 = dealObj.data() as FirebaseFirestore.DocumentData

		const englishPayload: messaging.MessagingPayload = {
			notification: {
				title: notificationSnapshot.get("data")["senderName"] + "just suggested a reward to you",
				body: notificationSnapshot.get("data")["itemName"],
				clickAction: "FLUTTER_NOTIFICATION_CLICK",
			},
			data: {
				"data": JSON.stringify(rewardObjDocumentData2),
				"type": notificationSnapshot.get("type")
			}
		};
		const token = clients.get("device")["token"]
		await fcm.sendToDevice([token], englishPayload);

	}
};

export const handleTaskCreatedNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	const receiver = await getUserByEmail(
		notificationSnapshot.get("receiver"),
		db
	);

	if (!_.isNil(receiver)) {

		const clients = await db
			.collection(collections.users)
			.doc(receiver.id)
			.get();


		await Promise.all([
			db
				.collection(collections.tasks)
				.doc(notificationSnapshot.get("data")["itemId"])
				.update({
					remoteId: notificationSnapshot.get("data")["itemId"]
				})
		]);


		const dealObj = await db
			.collection(collections.tasks)
			.doc(notificationSnapshot.get("data")["itemId"])
			.get();
		//  Converting the firebase obkect to javascript object
		const dealObjDocumentData2 = dealObj.data() as FirebaseFirestore.DocumentData

		const englishPayload: messaging.MessagingPayload = {
			notification: {
				title: "New Deal Created by :" + notificationSnapshot.get("data")["senderName"],
				body: notificationSnapshot.get("data")["itemName"],
				clickAction: "FLUTTER_NOTIFICATION_CLICK",
			},
			data: {
				"data": JSON.stringify(dealObjDocumentData2),
				"type": notificationSnapshot.get("type")
			}
		};
		const token = clients.get("device")["token"]
		await fcm.sendToDevice([token], englishPayload);
	}
};

export const handleTaskStatusChangedNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	const receiver = await getUserByEmail(
		notificationSnapshot.get("receiver"),
		db
	);

	if (!_.isNil(receiver)) {

		const clients = await db
			.collection(collections.users)
			.doc(receiver.id)
			.get();


		const dealObj = await db
			.collection(collections.tasks)
			.doc(notificationSnapshot.get("data")["itemId"])
			.get();
		//  Converting the firebase obkect to javascript object
		const dealObjDocumentData2 = dealObj.data() as FirebaseFirestore.DocumentData

		const englishPayload: messaging.MessagingPayload = {
			notification: {
				title: notificationSnapshot.get("data")["senderName"] + " updated deal status to: " + notificationSnapshot.get("data")["itemStatus"],
				body: notificationSnapshot.get("data")["itemName"],
				clickAction: "FLUTTER_NOTIFICATION_CLICK",
			},
			data: {
				"data": JSON.stringify(dealObjDocumentData2),
				"type": notificationSnapshot.get("type")
			}
		};
		const token = clients.get("device")["token"]
		await fcm.sendToDevice([token], englishPayload);
	}
};

export const handleTaskDeclinedNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	const receiver = await getUserByEmail(
		notificationSnapshot.get("receiver"),
		db
	);

	if (!_.isNil(receiver)) {
		const clients = await db
			.collection(collections.users)
			.doc(receiver.id)
			.get();

		const dealObj = await db
			.collection(collections.tasks)
			.doc(notificationSnapshot.get("data")["itemId"])
			.get();
		//  Converting the firebase obkect to javascript object
		const dealObjDocumentData2 = dealObj.data() as FirebaseFirestore.DocumentData


		const englishPayload: messaging.MessagingPayload = {
			notification: {
				title: notificationSnapshot.get("data")["senderName"] + " updated deal status to: " + notificationSnapshot.get("data")["itemStatus"],
				body: notificationSnapshot.get("data")["itemName"],
				clickAction: "FLUTTER_NOTIFICATION_CLICK",
			},
			data: {
				"data": JSON.stringify(dealObjDocumentData2),
				"type": notificationSnapshot.get("type")
			}
		};
		const token = clients.get("device")["token"]
		await fcm.sendToDevice([token], englishPayload);
	}
};
export const handleClaimedGoalNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	const receiver = await getUserByEmail(
		notificationSnapshot.get("receiver"),
		db
	);

	if (!_.isNil(receiver)) {
		const clients = await db
			.collection(collections.users)
			.doc(receiver.id)
			.get();

		const dealObj = await db
			.collection(collections.goals)
			.doc(notificationSnapshot.get("data")["itemId"])
			.get();
		//  Converting the firebase obkect to javascript object
		const rewardObjDocumentData2 = dealObj.data() as FirebaseFirestore.DocumentData

		const englishPayload: messaging.MessagingPayload = {
			notification: {
				title: notificationSnapshot.get("data")["senderName"] + " just claimed a reward",
				body: notificationSnapshot.get("data")["itemName"],
				clickAction: "FLUTTER_NOTIFICATION_CLICK",
			},
			data: {
				"data": JSON.stringify(rewardObjDocumentData2),
				"type": notificationSnapshot.get("type")
			}
		};
		const token = clients.get("device")["token"]
		await fcm.sendToDevice([token], englishPayload);
	}
};

export const handleNewMessageNotification = async (
	notificationSnapshot: FirebaseFirestore.DocumentSnapshot,
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) => {
	const receiver = await getUserByEmail(
		notificationSnapshot.get("receiver"),
		db
	);

	if (!_.isNil(receiver)) {
		const clients = await db
			.collection(collections.users)
			.doc(receiver.id)
			.get();

		const messageObj = await db
			.collection(collections.chatMessages)
			.doc(notificationSnapshot.get("data")["itemId"])
			.get();
		//  Converting the firebase obkect to javascript object
		const chatObjDocumentData2 = messageObj.data() as FirebaseFirestore.DocumentData

		const englishPayload: messaging.MessagingPayload = {
			notification: {
				title: notificationSnapshot.get("data")["senderName"] + " just sent you a message ",
				body: notificationSnapshot.get("data")["itemName"],
				type: "message",
				clickAction: "FLUTTER_NOTIFICATION_CLICK",
			},
			data: {
				"data": JSON.stringify(chatObjDocumentData2),
				"type": notificationSnapshot.get("type")
			}
		};
		const token = clients.get("device")["token"]
		await fcm.sendToDevice([token], englishPayload);
	}
};
