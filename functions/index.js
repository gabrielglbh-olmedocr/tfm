const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { user } = require("firebase-functions/lib/providers/auth");

admin.initializeApp({
  databaseURL: "https://kelo-64c5c.firebaseio.com",
});

const database = admin.firestore();

const message = {
  token: "",
  notification: {
    title: "",
    body: "",
  },
};

exports.createChore = functions.firestore
  .document("groups/{groupId}/chores/{choreId}")
  .onCreate((snap, context) => {
    const groupId = context.params.groupId;
    const choreId = context.params.choreId;
    const chore = snap.data();

    console.log("Created chore with id: " + choreId);

    const documentRef = database.collection("groups")
      .doc(groupId).collection("users").doc(chore.assignee);

    console.log("Got document reference pointing to user at " +
      documentRef.path);

    return documentRef.get()
      .then((documentSnapshot) => {
        if (documentSnapshot.exists) {
          const user = documentSnapshot.data();
          const userId = documentSnapshot.id;

          console.log("Obtained user from chore: " + userId);

          message.token = user.messagingToken;
          message.notification.title = "New chore to do!";

          const expirationDate = chore.expiration.toDate().toDateString();

          message.notification.body =
            "You have been assigned to '" + chore.name + "' due " +
            expirationDate;

          console.log("Sending message: " + JSON.stringify(message));

          admin.messaging().send(message)
            .then((response) => {
              console.log("Successfully sent message: " + response);
            })
            .catch((error) => {
              console.log("Error sending notification: " + error);
            });
        } else {
          console.log("The snapshot did not exist");
        }
      })
      .catch((error) => {
        console.log("Error getting the user to notify: " + error);
      });
  });

exports.editChore = functions.firestore
  .document("groups/{groupId}/chores/{choreId}")
  .onUpdate((change, context) => {
    const groupId = context.params.groupId;
    const choreId = context.params.choreId;
    const newChore = change.after.data();
    const oldChore = change.before.data();

    console.log("Updated chore with id: " + choreId);

    if (newChore.isCompleted != oldChore.isCompleted &&
      newChore.isCompleted && !oldChore.isCompleted) {
      const creatorRef = database.collection("groups")
        .doc(groupId).collection("users").doc(newChore.creator);

      console.log("Got document reference pointing to user at " +
        creatorRef.path);

      return creatorRef.get()
        .then((creatorSnapshot) => {
          if (creatorSnapshot.exists) {
            const creator = creatorSnapshot.data();
            message.token = creator.messagingToken;
            message.notification.title = "Completed chore!";
            message.notification.body =
              "The chore '" + newChore.name + "' was completed";

            admin.messaging().send(message)
              .then((response) => {
                console.log("Successfully sent message: " + response);
              })
              .catch((error) => {
                console.log("Error sending notification: " + error);
              });
          } else {
            console.log("The snapshot did not exist");
          }
        })
        .catch((error) => {
          console.log("Error getting the user to notify: " + error);
        });
    } else {
      const documentRef = database.collection("groups")
        .doc(groupId).collection("users").doc(newChore.assignee);

      return documentRef.get()
        .then((documentSnapshot) => {
          if (documentSnapshot.exists) {
            const user = documentSnapshot.data();
            const userId = documentSnapshot.id;

            console.log("Obtained user from chore: " + userId);

            message.token = user.messagingToken;
            message.notification.title = "Updated chore!";

            let updatedFieldsMsg = "The ";
            const changedFields = [];
            if (newChore.assignee != oldChore.assignee) {
              changedFields.push("Assignee");
            }
            const newExpirationDate =
              newChore.expiration.toDate().toDateString();
            const oldExpirationDate =
              oldChore.expiration.toDate().toDateString();
            if (newExpirationDate != oldExpirationDate) {
              changedFields.push("Expiration date");
            }
            if (newChore.name != oldChore.name) {
              changedFields.push("Name");
            }
            if (newChore.points != oldChore.points) {
              changedFields.push("Importance");
            }

            for (let x = 0; x < changedFields.length; x++) {
              if (x == changedFields.length - 2) {
                updatedFieldsMsg = updatedFieldsMsg.concat(
                  changedFields[x] + " and ");
              } else if (x != changedFields.length - 1) {
                updatedFieldsMsg = updatedFieldsMsg.concat(
                  changedFields[x] + ", ");
              } else {
                updatedFieldsMsg = updatedFieldsMsg.concat(
                  changedFields[x]);
              }
            }

            if (changedFields.length >= 2) {
              updatedFieldsMsg = updatedFieldsMsg.concat(" were updated.");
            } else if (changedFields.length == 1) {
              updatedFieldsMsg = updatedFieldsMsg.concat(" was updated.");
            } else {
              updatedFieldsMsg = "";
            }

            message.notification.body =
              "The chore '" + oldChore.name + "' was modified. " +
              updatedFieldsMsg;

            console.log("Sending message: " + JSON.stringify(message));

            admin.messaging().send(message)
              .then((response) => {
                console.log("Successfully sent message: " + response);
              })
              .catch((error) => {
                console.log("Error sending notification: " + error);
              });
          } else {
            console.log("The snapshot did not exist");
          }
        })
        .catch((error) => {
          console.log("Error getting the user to notify: " + error);
        });
    }
  });

exports.deleteChore = functions.firestore
  .document("groups/{groupId}/chores/{choreId}")
  .onDelete((snap, context) => {
    const groupId = context.params.groupId;
    const choreId = context.params.choreId;
    const chore = snap.data();

    console.log("Deleted chore with id: " + choreId);

    const documentRef = database.collection("groups")
      .doc(groupId).collection("users").doc(chore.assignee);

    console.log("Got document reference pointing to user at " +
      documentRef.path);

    return documentRef.get()
      .then((documentSnapshot) => {
        if (documentSnapshot.exists) {
          const user = documentSnapshot.data();
          const userId = documentSnapshot.id;

          console.log("Obtained user from chore: " + userId);

          message.token = user.messagingToken;
          message.notification.title = "Deleted chore!";
          message.notification.body =
            "The chore '" + chore.name + "' was deleted";

          console.log("Sending message: " + JSON.stringify(message));

          admin.messaging().send(message)
            .then((response) => {
              console.log("Successfully sent message: " + response);
            })
            .catch((error) => {
              console.log("Error sending notification: " + error);
            });
        } else {
          console.log("The snapshot did not exist");
        }
      })
      .catch((error) => {
        console.log("Error getting the user to notify: " + error);
      });
  });

exports.scheduledChoreExpirationCrontab = functions.pubsub
  .schedule("0 10 * * *")
  .timeZone("Europe/Madrid")
  .onRun(async (context) => {
    const groupRef = database.collection("groups");

    try {
      const groupsSnapshot = await groupRef.get();

      const dayInMillis = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const tomorrowDate = new Date(now + dayInMillis);
      const yesterdayDate = new Date(now - dayInMillis);

      const tomorrowTimestamp = admin.firestore.Timestamp.fromDate(tomorrowDate);
      const yesterdayTimestamp = admin.firestore.Timestamp.fromDate(yesterdayDate);

      const chorePromises = [];
      const userPromises = [];
      const chores = [];

      groupsSnapshot.forEach((groupSnapshot) => {
        if (groupSnapshot.exists) {
          const choresRef = groupRef
            .doc(groupSnapshot.ref.id)
            .collection("chores")
            .where("expiration", ">", yesterdayTimestamp)
            .where("expiration", "<", tomorrowTimestamp)
            .where("isCompleted", "==", false);

          const promise = choresRef.get();
          chorePromises.push(promise);
        }
      });

      const choresSnapshotPromises = await Promise.all(chorePromises);

      choresSnapshotPromises.forEach((choresSnapshot) => {
        choresSnapshot.forEach((choreSnapshot) => {
          const chore = choreSnapshot.data();
          chores.push(chore);
          const userRef = choreSnapshot.ref
            .parent.parent
            .collection("users")
            .doc(chore.assignee);

          console.log("chore: " + JSON.stringify(chore));

          console.log("AS TIMESTAMP: expiration's epoch: " + chore.expiration);
          console.log("AS TIMESTAMP: tomorrow's epoch: " + tomorrowTimestamp);
          console.log("AS TIMESTAMP: yesterday's epoch: " + yesterdayTimestamp);

          const promise = userRef.get();
          userPromises.push(promise);
        })
      });

      const userSnapshotPromises = await Promise.all(userPromises);

      userSnapshotPromises.forEach((userSnapshot, index) => {
        const user = userSnapshot.data();

        if (user != undefined) {
          message.token = user.messagingToken;
          message.notification.title = "Chore expires today!";
          message.notification.body =
            "The chore '" + chores[index].name + "' is about to expire";

          console.log("Sending message: " + JSON.stringify(message));

          admin.messaging().send(message)
            .then((response) => {
              console.log("Successfully sent message: " + response);
            })
            .catch((error) => {
              console.log("Error sending notification: " + error);
            });
        }
      })

    } catch (error) {
      console.log("Error getting the group snapshot: " + error);
    }
  });
