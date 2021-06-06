const admin = require("firebase-admin");
const functions = require("firebase-functions");

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
                  "You have been assigned to '" + chore.name + "' due to " +
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

        return creatorRef.get()
            .then((creatorSnapshot) => {
              if (creatorSnapshot.exists) {
                const creator = creatorSnapshot.data();
                message.token = creator.messagingToken;
                message.notification.title = "Completed chore!";
                message.notification.body =
                    "The chore '" + newChore.name + "' was completed";
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
