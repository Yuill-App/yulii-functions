import * as functions from "firebase-functions";
import collections from "../constants/collections";
import * as _ from "lodash";
import { FieldValue } from "@google-cloud/firestore";
import { Statuses } from "../enums/statuses_enum";
const Bottleneck = require("bottleneck");
import { Twilio } from "twilio";

export const usersService = function (adminDb: FirebaseFirestore.Firestore) {
  const onUserUpdate = () => functions.firestore.document(`${collections.users}/{userId}`).onUpdate(async (snapshot, context) => {
    const currentUserVersion = snapshot.after;
    const formerUserVersion = snapshot.before;
    const userId = currentUserVersion.get("remoteId");
    const phone = currentUserVersion.get("phone");

    const beforeFriendsIds = formerUserVersion.get("friends") || [];
    const currentFriendsIds = currentUserVersion.get("friends") || [];

    console.log("before", beforeFriendsIds);
    console.log("current", currentFriendsIds);

    const deletedIds: string[] = _.difference(beforeFriendsIds, currentFriendsIds);
    console.log("deleted", deletedIds);

    if (currentUserVersion.get("sentCode") === true) {
      const verificationCode = generateVerificationCode();
      await adminDb
        .collection(collections.users)
        .doc(userId)
        .update(
          {
            isPhoneVerified: false,
            sentCode: false,
            verificationCode: verificationCode
          }
        );
      _sendSMS(phone, verificationCode, userId);
    }

    if (deletedIds.length > 0) {
      const limiter = new Bottleneck({ maxConcurrent: 5 });
      const tasksToRun = deletedIds.map(id => limiter.schedule(() =>
        adminDb.collection(collections.users).doc(id).update({
          friends: FieldValue.arrayRemove(currentUserVersion.id),
        })
      ))

      await Promise.all(tasksToRun);
      await Promise.all([
        _deleteRelatedGoals(currentUserVersion.id, deletedIds),
        _deleteRelatedTasks(currentUserVersion.id, deletedIds),
      ]);
    }
  });

  const generateVerificationCode = () => {
    return Math.floor(Math.random() * 9000 + 1000);
  }

  const _sendSMS = (phoneNumber: any, verificationCode: any, userId: any) => {
    const accountSid = "ACce4318fcc89dcddd8d5b00620a005055";
    const authToken = "07fae02e5c83b194de61b6db11374d5d";
    const client = new Twilio(accountSid, authToken);
    // Send Twillo SMS
    client.messages
      .create({
        to: phoneNumber,
        body: `${verificationCode} is your verification code`,
        from: "+14175453895"
      })
      .then(async (message: any) => console.log("done"));
  }

  const _getUser = async (startIndex: any, pageSize: any, userId: any) => {
    
     let query = await adminDb.collection(collections.users)
        .offset(startIndex)
        .limit(pageSize)
        
      // Add where clause if user filter is provided
     if (userId != "" && userId != null) {
        query = query.where("friends", "array-contains", userId);
    }

    // Retrieve data with pagination and where clause
    const snapshot = await query.get();

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }

  const _deleteRelatedGoals = async (refererId: string, assigneeIds: string[]) => {
    console.log("deleting related goals...");
    console.log("refererId", refererId);
    console.log("assigneeId", assigneeIds);

    const goalsResults = await adminDb.collection(collections.goals)
      .where("referer", "array-contains-any", [refererId])
      .get();

    if (!goalsResults.empty) {
      const notDoneGoals = goalsResults.docs.filter(goal =>
        _.isArray(goal.get("assignees")) &&
        _.isEqual(goal.get("assignees").sort(), assigneeIds.sort()) &&
        goal.get("status") !== Statuses.Done
      );

      console.log("goals to remove:", goalsResults.size);

      if (notDoneGoals.length > 0) {
        const batch = adminDb.batch();

        notDoneGoals.forEach(goal => {
          batch.delete(goal.ref);
        })

        await batch.commit();
        console.log("related goals deleted !");
        console.log("==");
      }
    }
  }

  const _deleteRelatedTasks = async (authorId: string, assigneeIds: string[]) => {
    console.log("deleting related tasks...");
    console.log("authorId", authorId);
    console.log("assigneeId", assigneeIds);

    const tasksResults = await adminDb.collection(collections.tasks)
      .where("authorId", "==", authorId)
      .get();

    if (!tasksResults.empty) {
      const notDoneTasks = tasksResults.docs.filter(task =>
        _.isArray(task.get("assignees")) &&
        _.isEqual(task.get("assignees").sort(), assigneeIds.sort()) &&
        task.get("status") !== Statuses.Done
      );


      if (notDoneTasks.length > 0) {
        const batch = adminDb.batch();

        notDoneTasks.forEach(task => {
          batch.delete(task.ref);
        })

        await batch.commit();
        console.log("related tasks deleted !");
        console.log("==");
      }
    }
  }

  return {
    onUserUpdate,
    _getUser
  }
}