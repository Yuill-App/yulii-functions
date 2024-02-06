import { messaging } from "firebase-admin";
import collections from "../constants/collections";
import { } from "lodash";
import { usersService } from "../services/users_service";
import * as functions from "firebase-functions";
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
                              //  console.log("I can see this very well")
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
/* 
               const sendNotification = async () => {
                    const title = "testing up np";
                    const body = "I love this thing";
                    const token = "cOgMl3FrSEuESEqFo6LxiO:APA91bFml_WPI-bO24zFVK2popdRLgOkC6w7M0nk1tROi5HBLA3FMM8CNH5QxMxXPaHXL9TJFmJtSUJo_KYada7CJUNR2Mt2Wk6ZhMudCqfQr-C1T7OH51dGULuaX57pgS9ClJJftvqJ";
                    try {
                      const payload = {
                        notification: {
                          title: title,
                          body: body,
                        }
                      };
                      console.log(payload)
                      console.log(token)
                      
                     const response = await fcm.sendToDevice([token], payload);
                     console.log(response)
                      return {
                        success: true,
                       // response: "Successfully sent message: " + response,
                      };
                    } catch (error) {
                      throw new functions.https.HttpsError(
                          "invalid-argument", "Error: " + error);
                    }
                  };
    
 */
    return {
		onUserCreation,
       // sendNotification,
        usersService: usersService(db),
        onNotificationCreation,
		tasksServices: tasksServices(db),
        claimsServices: claimsServices(db),
		invitationsService: invitationsService(db),
		goalsService: goalsService(db),
		chatMessagesService: chatMessagesService(db),
	};
}