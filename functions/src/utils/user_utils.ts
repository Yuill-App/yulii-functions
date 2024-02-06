import collections from "../constants/collections";

export const getUserById = async (
	userId: string,
	adminDb: FirebaseFirestore.Firestore
) => {
	const user = await adminDb.collection(collections.users).doc(userId).get();
	return user;
};

export const getUserByEmail = async (
	email: string,
	adminDb: FirebaseFirestore.Firestore
) => {
	const userQuery = await adminDb
		.collection(collections.users)
		.where("email", "==", email)
		.limit(1)
		.get();

	if (userQuery.size > 0) {
		const user = await userQuery.docs[0].ref.get();

		return user;
	}
	return null;
};

export const displayName = (user: FirebaseFirestore.DocumentSnapshot) =>
	`${user.get("firstname")} ${user.get("lastname")}`;

export const getLastCreditTransaction = async (
	userId: string,
	adminDb: FirebaseFirestore.Firestore
) => {
	const results = await adminDb
		.collection(collections.creditTransactions)
		.where("ownerId", "==", userId)
		.orderBy("createdAt", "desc")
		.limit(1)
		.get();

	return !results.empty ? results.docs[0] : null;
};
