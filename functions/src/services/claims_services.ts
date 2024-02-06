import * as functions from "firebase-functions";
import collections from "../constants/collections";
import { Claim } from "./../models/claim.dto";
import { GoalType } from "../enums/goal_type.enum";
import {
	getUserById,
	getLastCreditTransaction,
	displayName,
} from "./../utils/user_utils";
import * as _ from "lodash";
import { CreditTransactionTypes } from "../enums/credit_transaction_types_enum";
import { NotificationDto } from "../models/notification.dto";
import { NotificationTypes } from "../enums/notification_types_enum";
const moment = require("moment");

export const claimsServices = function (adminDb: FirebaseFirestore.Firestore) {
	const onClaimCreation = () =>
		functions.firestore
			.document(`${collections.claims}/{claimId}`)
			.onCreate(async (snapshot, context) => {
				const claim = Claim.fromObject(snapshot.data() as any);

				const author = await getUserById(claim.authorId, adminDb);

				const goal = await adminDb
					.collection(collections.goals)
					.doc(claim.goalId)
					.get();

				await adminDb
					.collection(collections.goals)
					.doc(goal.id)
					.set({ hasBeenClaimAtLeastOnce: true }, { merge: true });

				const goalReferer = await getUserById(goal.get("referer")[0], adminDb);

				console.log("referer", goalReferer.data());

				await adminDb
					.collection(collections.notifications)
					.doc()
					.create(
						new NotificationDto(
							goalReferer.get("email"),
							NotificationTypes.GoalClaimed,
							{
								itemId: goal.id,
								itemName: goal.get("name"),
								sender: author.id,
								senderName: displayName(author),
							}
						).toObject()
					);

				if (claim.goalType === GoalType.Classic) {
					console.log("goal is classic");

					if (author.exists) {
						console.log("author exists");

						const lastTransaction = await getLastCreditTransaction(
							author.id,
							adminDb
						);

						const previous = !_.isNil(lastTransaction)
							? lastTransaction.get("current")
							: 0;

						const transactionValue = claim.points;
						const current = previous - transactionValue;

						const newCreditTransactionData = {
							previous: previous,
							transactionValue: transactionValue,
							current: current,
							transactionType: CreditTransactionTypes.Decrease,
							ownerId: author.id,
							createdAt: moment.utc(new Date()).valueOf(),
						};

						await adminDb
							.collection(collections.creditTransactions)
							.doc()
							.create(newCreditTransactionData);
					}
				}
			});

	return {
		onClaimCreation,
	};
};
