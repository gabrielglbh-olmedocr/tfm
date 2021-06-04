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
              message.notification.body =
                  "You have been assigned to " + chore.name;

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
      const chore = change.after.data();

      console.log("Updated chore with id: " + choreId);

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
              message.notification.title = "Updated chore!";
              message.notification.body =
                  "The chore " + chore.name + " was modified";

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
                  "The chore " + chore.name + " was deleted";

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
