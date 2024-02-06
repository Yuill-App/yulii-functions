// import * as express from "express";
// import * as firebaseHelper from "firebase-functions-helper";
import * as functions from "firebase-functions";
// import * as httpStatus from "http-status";
import collections from "../constants/collections";
import { } from "lodash";
import { messaging } from "firebase-admin";
import {
	handleInvitationNotification,
	handleAcceptedInvitationNotification,
	handleGoalCreatedNotification,
	handleGoalSuggestedNotification,
	handleTaskCreatedNotification,
	handleTaskStatusChangedNotification,
	handleTaskDeclinedNotification,
	handleClaimedGoalNotification,
	handleNewMessageNotification,
} from "../services/notification_service";
import { NotificationTypes } from "../enums/notification_types_enum";
import { tasksServices } from "../services/tasks_services";
import { claimsServices } from "../services/claims_services";
import { invitationsService } from "./../services/invitations_service";
import { goalsService } from "./../services/goals_services";
import { chatMessagesService } from "../services/chat_messages_service";
import { usersService } from "../services/users_service";

export const firestoreEvents = function (
	db: FirebaseFirestore.Firestore,
	fcm: messaging.Messaging
) {
	const onUserCreation = () =>
		functions.firestore
			.document(collections.users)
			.onCreate(async (snapshot, context) => {
				const itemDataSnap = await snapshot.ref.get();
				console.log(`users created ${JSON.stringify(itemDataSnap.data())}`);
			});

	const onNotificationCreation = () =>
		functions.firestore
			.document(`${collections.notifications}/{notificationId}`)
			.onCreate(async (snapshot, context) => {
				try {
					const itemDataSnap = await snapshot.ref.get();

					switch (itemDataSnap.get("type")) {
						case NotificationTypes.Invitation:
							await handleInvitationNotification(itemDataSnap, db, fcm);
							break;
						case NotificationTypes.InvitationAccepted:
							await handleAcceptedInvitationNotification(itemDataSnap, db, fcm);
							break;
						case NotificationTypes.GoalCreated:
							await handleGoalCreatedNotification(itemDataSnap, db, fcm);
							break;
						case NotificationTypes.GoalSuggested:
							await handleGoalSuggestedNotification(itemDataSnap, db, fcm);
							break;
						case NotificationTypes.TaskCreated:
							await handleTaskCreatedNotification(itemDataSnap, db, fcm);
							break;
						case NotificationTypes.TaskStatusChanged:
							await handleTaskStatusChangedNotification(itemDataSnap, db, fcm);
							break;
						case NotificationTypes.TaskDeclined:
							await handleTaskDeclinedNotification(itemDataSnap, db, fcm);
							break;
						case NotificationTypes.GoalClaimed:
							await handleClaimedGoalNotification(itemDataSnap, db, fcm);
							break;
						case NotificationTypes.NewMessage:
							await handleNewMessageNotification(itemDataSnap, db, fcm);
							break;
					}
				} catch (e) {
					console.error(e);
				}
			});
	return {
		onUserCreation,
		// onInvitationCreation,
		onNotificationCreation,
		// onNotificationUpdate,
		tasksServices: tasksServices(db),
		claimsServices: claimsServices(db),
		invitationsService: invitationsService(db),
		goalsService: goalsService(db),
		chatMessagesService: chatMessagesService(db),
		usersService: usersService(db),
	};
};
