// require("dotenv").config();
// import * as functions from "firebase-functions";
// simport * as admin from "firebase-admin";
// import * as express from "express";
// import * as bodyParser from "body-parser";
import * as admin from "firebase-admin";
import * as appV1 from "./v1/app";

import { onRequest } from "firebase-functions/v2/https";
//import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const getUsers = onRequest(async (request, response) => {
  const page: number = parseInt(request.query.page as string, 10) || 1;
  const userId: string = request.query.userId as string;
  const pageSize: number = parseInt(request.query.pageSize as string, 10) || 10;

  // Calculate the starting index for pagination
  const startIndex: number = (page - 1) * pageSize;

  try {
    const users = await firestoreEvents.usersService._getUser(
      startIndex, pageSize, userId
    );
    response.json({ success: true, users });

  } catch (error) {
    console.error("Error getting data:", error);
  }
});

const firestoreEvents = appV1.firestoreEvents(
  admin.firestore(),
  admin.messaging()
);

export const onUserUpdate = firestoreEvents.usersService.onUserUpdate();
export const onNotificationCreation = firestoreEvents.onNotificationCreation();
export const onTaskCreation = firestoreEvents.tasksServices.onTaskCreation();
export const onTaskUpdate = firestoreEvents.tasksServices.onTaskUpdate();

export const onClaimCreation = firestoreEvents.claimsServices.onClaimCreation();
export const onInvitationCreation = firestoreEvents.invitationsService.onInvitationCreation();
export const onInvitationUpdate = firestoreEvents.invitationsService.onInvitationUpdate();
export const onGoalCreation = firestoreEvents.goalsService.onGoalCreation();
export const onGoalUpdate = firestoreEvents.goalsService.onGoalUpdate();
export const onChatMessageWrite = firestoreEvents.chatMessagesService.onChatMessageWrite();
