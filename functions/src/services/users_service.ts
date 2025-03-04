import * as functions from "firebase-functions";
import collections from "../constants/collections";
import * as _ from "lodash";
import { FieldValue } from "@google-cloud/firestore";
import { Statuses } from "../enums/statuses_enum";
const Bottleneck = require("bottleneck");
import { Twilio } from "twilio";
import * as admin from "firebase-admin";


export const usersService = function (adminDb: FirebaseFirestore.Firestore) {


  const removeIdFromArray = async (targetId: any) => {
    const collectionRef = await admin.firestore()
    .collection(collections.users)
   // .where("friends", "array-contains", targetId);
    const snapshot = await collectionRef.where("friends", "array-contains", targetId).get();
    console.log("target", targetId);
    const batch = admin.firestore().batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.friends && Array.isArray(data.friends)) {
        const updatedArray = data.friends.filter(id => id !== targetId);
        if (updatedArray.length !== data.friends.length) {
          const docRef = collectionRef.doc(doc.id);
          console.log("new friends", updatedArray);
          batch.update(docRef, { friends: updatedArray });
        }
      }
    });

    await batch.commit();
    console.log("Update complete.");
  }


  const onUserDelete = () => functions.firestore.document(`${collections.users}/{userId}`).onDelete(async (user) => {
    const uid = user.id;
    const email = user.get("email");

    try {
 
      removeIdFromArray(uid);

      // delete chats 
      const chats = await admin.firestore()
        .collection(collections.chats)
        .where("participantsIds", "array-contains", uid)
        .get();

      const chatsBatch = admin.firestore().batch();
      chats.forEach((doc) => {
        chatsBatch.delete(doc.ref);
      });
      await chatsBatch.commit();

      // delete chat messages
      const chatMessages = await admin.firestore()
        .collection(collections.chatMessages)
        .where("participantsIds", "array-contains", uid)
        .get();
      const chatMessagesBatch = admin.firestore().batch();
      chatMessages.forEach((doc) => {
        chatMessagesBatch.delete(doc.ref);
      });
      await chatMessagesBatch.commit();

      //delete Invitations
      const invitations = await admin.firestore()
        .collection(collections.invitations)
        .where("receiver", "==", email)
        .get();

      const invitationsBatch = admin.firestore().batch();

      invitations.forEach((doc) => {
        invitationsBatch.delete(doc.ref);
      });
      await invitationsBatch.commit();


      //delete socials
      const socials = await admin.firestore()
        .collection(collections.events)
        .where("author", "==", uid)
        .get();

      const socialsBatch = admin.firestore().batch();

      const postIds = [];

      socials.forEach((doc) => {
        const postId = doc.get("id"); // Replace 'yourFieldName' with the actual field name
        postIds.push(postId);
        socialsBatch.delete(doc.ref);
      });
      await socialsBatch.commit();

      console.log(`Successfully deleted user data for UID: ${uid}`);
    } catch (error) {
      console.error(`Error deleting user data for UID: ${uid}`, error);
    }

  });

  const onUserUpdate = () => functions.firestore.document(`${collections.users}/{userId}`).onUpdate(async (snapshot, context) => {
    const currentUserVersion = snapshot.after;
    const formerUserVersion = snapshot.before;
    const userId = currentUserVersion.get("remoteId");
    const phone = currentUserVersion.get("phone");

    //removeIdFromArray(userId);

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
    const authToken = "e96f73e25cdcc50b8716bb681e4c6791";
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

  const _getUser = async (
    startIndex: any,
    pageSize: any,
    userId: any
  ) => {

    let query = await adminDb.collection(collections.users)
      .offset(startIndex)
      .limit(pageSize);

    // Add where clause if user filter is provided
    if (userId != "" && userId != null) {
      query = query.where("friends", "array-contains", userId);
    }


    // Retrieve data with pagination and where clause
    const snapshot = await query.get();

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }

  const _getUserFriends = async (
    startIndex: any,
    pageSize: any,
    userId: any
  ) => {

    let query = await adminDb.collection(collections.users)
      .offset(startIndex)
      .limit(pageSize);

    // Add where clause if user filter is provided
    if (userId != "" && userId != null) {
      query = query.where("remoteId", "==", userId);
    }

    // Retrieve data with pagination and where clause
    const snapshot = await query.get();

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }

  const _getUsersFromFriendsArray = async (startIndex: any, pageSize: any, userId: any) => {

    // Step 1: Query to get the user by userId (optional filter)
    let query = adminDb.collection(collections.users)
      .offset(startIndex)
      .limit(pageSize);

    if (userId) {
      query = query.where("remoteId", "==", userId);
    }

    // Fetch the user's document
    const snapshot = await query.get();

    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();

      // Step 2: Get friendsArray from the user document
      const friendsArray = data.friends || []; // Replace 'friends' with the actual field name

      if (friendsArray.length > 0) {
        // Step 3: Use 'in' operator to query users whose IDs are in friendsArray
        const friendsQuery = adminDb.collection(collections.users)
          .where("remoteId", "in", friendsArray)
          .offset(startIndex)
          .limit(pageSize);

        const friendsSnapshot = await friendsQuery.get();

        // Step 4: Extract user data from the friendsSnapshot
        const friendsData = friendsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return friendsData;
      } else {
        return []; // No friends in the array
      }
    } else {
      return []; // No user found
    }
  };


  const _getUserTransactions = async (
    startIndex: any,
    pageSize: any,
    userId: any,
    startDate: any,
    endDate: any,
    title: any,
    type: any,
    status: any,
    points: any
  ) => {

    let query = await adminDb.collection(collections.creditTransactions)
      .offset(startIndex)
      .limit(pageSize)

    // Add where clause if user filter is provided
    if (userId != "" && userId != null) {
      query = query.where("ownerId", "==", userId);
    }

    if (startDate != "" && startDate != null) {
      const from = admin.firestore.Timestamp.fromDate(new Date(startDate));
      query = query.where("createdAt", ">=", from);
    }

    if (endDate != "" && endDate != null) {
      const to = admin.firestore.Timestamp.fromDate(new Date(endDate));
      query = query.where("createdAt", "<=", to);
    }

    if (title != "" && title != null) {
      query = query.where("taskName", "array-contains", title);
    }

    if (type != "" && type != null) {
      query = query.where("taskType", "==", type);
    }

    if (status != "" && status != null) {
      query = query.where("status", "==", status);
    }

    if (points != "" && points != null && !Number.isNaN(points)) {
      query = query.where("transactionValue", "==", points);
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
    onUserDelete,
    _getUser,
    _getUserFriends,
    _getUsersFromFriendsArray,
    _getUserTransactions
  }
}