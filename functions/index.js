const admin = require("firebase-admin")
const functions = require("firebase-functions")
const user = require("firebase-functions/lib/providers/auth")

admin.initializeApp({
  databaseURL: "https://kelo-64c5c.firebaseio.com",
})

const database = admin.firestore()

const message = {
  token: "",
  notification: {
    title: "",
    body: "",
  },
}

exports.createChore = functions.firestore
  .document("groups/{groupId}/chores/{choreId}")
  .onCreate(async (snap, context) => {
    const groupId = context.params.groupId
    const choreId = context.params.choreId
    const chore = snap.data()

    const documentRef = database.collection("groups")
      .doc(groupId).collection("users").doc(chore.assignee)

    try {
      const documentSnapshot = await documentRef.get()
      if (documentSnapshot.exists) {
        const user = documentSnapshot.data()

        message.token = user.messagingToken
        message.notification.title = "You have a new chore to do!"

        const expirationDate = chore.expiration.toDate().toDateString()

        message.notification.body =
          "You have been assigned to '" + chore.name + "' due " +
          expirationDate

        console.log("Sending message: " + JSON.stringify(message))

        admin.messaging().send(message)
          .then((response) => {
            console.log("Successfully sent message: " + response)
          })
          .catch((error) => {
            console.log("Error sending notification: " + error)
          })
      } else {
        console.log("The snapshot did not exist")
      }
    } catch (error_1) {
      console.log("Error getting the user to notify: " + error_1)
    }
  })

exports.editChore = functions.firestore
  .document("groups/{groupId}/chores/{choreId}")
  .onUpdate(async (change, context) => {
    const groupId = context.params.groupId
    const newChore = change.after.data()
    const oldChore = change.before.data()

    if (newChore.isCompleted != oldChore.isCompleted &&
      newChore.isCompleted && !oldChore.isCompleted) {
      const creatorRef = database.collection("groups")
        .doc(groupId).collection("users").doc(newChore.creator)

      try {
        const creatorSnapshot = await creatorRef.get()
        if (creatorSnapshot.exists) {
          const creator = creatorSnapshot.data()
          message.token = creator.messagingToken
          message.notification.title = "Your chore has been completed!"
          message.notification.body =
            "The chore '" + newChore.name + "' was completed by its assignee"

          admin.messaging().send(message)
            .then((response) => {
              console.log("Successfully sent message: " + response)
            })
            .catch((error) => {
              console.log("Error sending notification: " + error)
            })
        } else {
          console.log("The snapshot did not exist")
        }
      } catch (error_1) {
        console.log("Error getting the user to notify: " + error_1)
      }
    } else {
      const documentRef = database.collection("groups")
        .doc(groupId).collection("users").doc(newChore.assignee)

      try {
        const documentSnapshot = await documentRef.get()
        if (documentSnapshot.exists) {
          const user = documentSnapshot.data()

          message.token = user.messagingToken
          message.notification.title = "A chore has been modified!"

          let updatedFieldsMsg = "The "
          const changedFields = []
          if (newChore.assignee != oldChore.assignee) {
            changedFields.push("Assignee")
          }
          const newExpirationDate = newChore.expiration.toDate().toDateString()
          const oldExpirationDate = oldChore.expiration.toDate().toDateString()
          if (newExpirationDate != oldExpirationDate) {
            changedFields.push("Expiration date")
          }
          if (newChore.name != oldChore.name) {
            changedFields.push("Name")
          }
          if (newChore.points != oldChore.points) {
            changedFields.push("Importance")
          }

          for (let x = 0; x < changedFields.length; x++) {
            if (x == changedFields.length - 2) {
              updatedFieldsMsg = updatedFieldsMsg.concat(
                changedFields[x] + " and ")
            } else if (x != changedFields.length - 1) {
              updatedFieldsMsg = updatedFieldsMsg.concat(
                changedFields[x] + ", ")
            } else {
              updatedFieldsMsg = updatedFieldsMsg.concat(
                changedFields[x])
            }
          }

          if (changedFields.length >= 2) {
            updatedFieldsMsg = updatedFieldsMsg.concat(" were updated.")
          } else if (changedFields.length == 1) {
            updatedFieldsMsg = updatedFieldsMsg.concat(" was updated.")
          } else {
            updatedFieldsMsg = ""
          }

          message.notification.body =
            "The chore '" + oldChore.name + "' was modified. " +
            updatedFieldsMsg

          console.log("Sending message: " + JSON.stringify(message))

          admin.messaging().send(message)
            .then((response_1) => {
              console.log("Successfully sent message: " + response_1)
            })
            .catch((error_2) => {
              console.log("Error sending notification: " + error_2)
            })
        } else {
          console.log("The snapshot did not exist")
        }
      } catch (error_3) {
        console.log("Error getting the user to notify: " + error_3)
      }
    }
  })

exports.deleteChore = functions.firestore
  .document("groups/{groupId}/chores/{choreId}")
  .onDelete(async (snap, context) => {
    const groupId = context.params.groupId
    const chore = snap.data()

    const documentRef = database.collection("groups")
      .doc(groupId).collection("users").doc(chore.assignee)

    try {
      const documentSnapshot = await documentRef.get()
      if (documentSnapshot.exists) {
        const user = documentSnapshot.data()

        message.token = user.messagingToken
        message.notification.title = "A chore has been deleted!"
        message.notification.body =
          "The chore '" + chore.name + "' was deleted. You will not have to do it... yet."

        console.log("Sending message: " + JSON.stringify(message))

        admin.messaging().send(message)
          .then((response) => {
            console.log("Successfully sent message: " + response)
          })
          .catch((error) => {
            console.log("Error sending notification: " + error)
          })
      } else {
        console.log("The snapshot did not exist")
      }
    } catch (error_1) {
      console.log("Error getting the user to notify: " + error_1)
    }
  })

exports.createReward = functions.firestore
  .document("groups/{groupId}/rewards/{rewardId}")  
  .onCreate(async (snap, context) => {
    const groupId = context.params.groupId
    const reward = snap.data()

    const usersRef = database.collection("groups")
      .doc(groupId).collection("users").where("isAdmin", "==", false)

    try {
      const documentSnapshot = await usersRef.get()
      documentSnapshot.docs.forEach((doc) => {
        if (doc.exists) {
          const user = doc.data()
    
          message.token = user.messagingToken
          message.notification.title = "The admin has created a new reward!"  

          let freq = ""
          switch (reward.frequency) {
            case 1:
              freq = "every week"
              break
            case 2:
              freq = "every two weeks"
              break
            case 3:
              freq = "every month"
              break
            case 4:
              freq = "every two months"
              break
            case 5:
              freq = "every year"
              break
          }

          message.notification.body = "'" + reward.name + "' is for you to claim " + 
              freq + ". You must have the most points in your group to get it."
  
          console.log("Sending message: " + JSON.stringify(message))
  
          admin.messaging().send(message)
            .then((response) => {
              console.log("Successfully sent message: " + response)
            })
            .catch((error) => {
              console.log("Error sending notification: " + error)
            })
        } else {
          console.log("The snapshot did not exist")
        }
      })
    } catch (error_1) {
      console.log("Error getting the user to notify: " + error_1)
    }
  })

exports.editReward = functions.firestore
  .document("groups/{groupId}/rewards/{rewardId}")  
  .onUpdate(async (change, context) => {
    const groupId = context.params.groupId
    const newReward = change.after.data()
    const oldReward = change.before.data()

    if (newReward.name != oldReward.name || newReward.frequency != oldReward.frequency) {
      const usersRef = database.collection("groups")
          .doc(groupId).collection("users").where("isAdmin", "==", false)

      try {
        const documentSnapshot = await usersRef.get()
        documentSnapshot.docs.forEach((doc) => {
          if (doc.exists) {
            const user = doc.data()

            message.token = user.messagingToken
            message.notification.title = "The admin has updated the reward!"

            const updatedRewardFields = []
            let msg = "The "

            if (oldReward.name != newReward.name) {
              updatedRewardFields.push("Description")
            }
            if (oldReward.frequency != newReward.frequency) {
              updatedRewardFields.push("Frequency")
            }

            for (let x = 0; x < updatedRewardFields.length; x++) {
              if (x == updatedRewardFields.length - 2) {
                msg = msg.concat(updatedRewardFields[x] + " and ")
              } else if (x != updatedRewardFields.length - 1) {
                msg = msg.concat(updatedRewardFields[x] + ", ")
              } else {
                msg = msg.concat(updatedRewardFields[x])
              }
            }

            if (updatedRewardFields.length >= 2) {
              msg = msg.concat(" were updated.")
            } else if (updatedRewardFields.length == 1) {
              msg = msg.concat(" was updated.")
            } else {
              msg = ""
            }

            message.notification.body = "The reward '" + oldReward.name + 
                "' was modified. " + msg

            console.log("Sending message: " + JSON.stringify(message))
      
            admin.messaging().send(message)
              .then((response) => {
                console.log("Successfully sent message: " + response)
              })
              .catch((error) => {
                console.log("Error sending notification: " + error)
              })
          } else {
            console.log("The snapshot did not exist")
          }
        })
      } catch (error_1) {
        console.log("Error getting the user to notify: " + error_1)
      }
    } else if (newReward.creation != oldReward.creation) {
      const usersSnapshot = await change.after.ref.parent.parent.collection("users").get()

      usersSnapshot.forEach((userDocumentSnapshot) => {
        userDocumentSnapshot.ref.update({
          "points": 0,
        })

        const user = userDocumentSnapshot.data()
        message.token = user.messagingToken
        message.notification.title = "All points have been reset"
        message.notification.body = "The next reward is waiting for you!"

        console.log("Sending message: " + JSON.stringify(message))

        admin.messaging().send(message)
          .then((response) => {
            console.log("Successfully sent message: " + response)
          })
          .catch((error) => {
            console.log("Error sending notification: " + error)
          })
      })
    }
  }) 

exports.deleteReward = functions.firestore
  .document("groups/{groupId}/rewards/{rewardId}")  
  .onDelete(async (snap, context) => {
    const groupId = context.params.groupId
    const reward = snap.data()

    const documentRef = database.collection("groups")
        .doc(groupId).collection("users").where("isAdmin", "==", false)

    try {
      const documentSnapshot = await documentRef.get()
      documentSnapshot.docs.forEach((doc) => {
        if (doc.exists) {
          const user = doc.data()
    
          message.token = user.messagingToken
          message.notification.title = "The reward has been deleted!"
          message.notification.body =
            "The reward '" + reward.name + "' was deleted but keep up the good work!"
    
          admin.messaging().send(message)
            .then((response) => {
              console.log("Successfully sent message: " + response)
            })
            .catch((error) => {
              console.log("Error sending notification: " + error)
            })
        } else {
          console.log("The snapshot did not exist")
        }
      })
    } catch (error_1) {
      console.log("Error getting the user to notify: " + error_1)
    }
  })

exports.scheduledChoreExpirationCrontab = functions.pubsub
  .schedule("0 10 * * *")
  .timeZone("Europe/Madrid")
  .onRun(async (context) => {
    const groupsRef = database.collection("groups")

    try {
      const groupsSnapshot = await groupsRef.get()

      const dayInMillis = 24 * 60 * 60 * 1000
      const now = Date.now()
      const todayDate = new Date(now)
      const yesterdayDate = new Date(now - dayInMillis)

      const chorePromises = []
      const userPromises = []
      const chores = []

      groupsSnapshot.forEach((groupSnapshot) => {
        if (groupSnapshot.exists) {
          const choresRef = groupRef
            .doc(groupSnapshot.ref.id)
            .collection("chores")
            .where("isCompleted", "==", false)

          const promise = choresRef.get()
          chorePromises.push(promise)
        }
      })

      const choresSnapshotPromises = await Promise.all(chorePromises)

      choresSnapshotPromises.forEach((choresSnapshot) => {
        choresSnapshot.forEach((choreSnapshot) => {
          const chore = choreSnapshot.data()
          const expirationDate = chore.expiration.toDate()

          const yesterdayDay = yesterdayDate.getDate()
          const yesterdayMonth = yesterdayDate.getMonth() + 1
          const yesterdayYear = yesterdayDate.getFullYear()

          const expireDay = expirationDate.getDate()
          const expireMonth = expirationDate.getMonth() + 1
          const expireYear = expirationDate.getFullYear()

          const todayDay = todayDate.getDate()
          const todayMonth = todayDate.getMonth() + 1
          const todayYear = todayDate.getFullYear()

          if ((yesterdayYear == expireYear && yesterdayMonth == expireMonth &&
            yesterdayDay < expireDay) &&
            (todayYear == expireYear && todayMonth == expireMonth &&
              todayDay == expireDay)) {
            chores.push(chore)
            const userRef = choreSnapshot.ref
              .parent.parent
              .collection("users")
              .doc(chore.assignee)

            const promise = userRef.get()
            userPromises.push(promise)
          }
        })
      })

      const userSnapshotPromises = await Promise.all(userPromises)

      userSnapshotPromises.forEach((userSnapshot, index) => {
        const user = userSnapshot.data()

        if (user != undefined) {
          message.token = user.messagingToken
          message.notification.title = "The chore expires today!"
          message.notification.body =
            "The chore '" + chores[index].name + "' is about to expire. You better get it done!"

          console.log("Sending message: " + JSON.stringify(message))

          admin.messaging().send(message)
            .then((response) => {
              console.log("Successfully sent message: " + response)
            })
            .catch((error) => {
              console.log("Error sending notification: " + error)
            })
        }
      })

    } catch (error) {
      console.log("Error getting the group snapshot: " + error)
    }
  })

exports.scheduledGroupCleanup = functions.pubsub
  .schedule("0 4 * * *")
  .timeZone("Europe/Madrid")
  .onRun(async (context) => {
    const groupsRef = database.collection("groups")

    try {
      const groupsSnapshot = await groupsRef.get()

      const groupsRefArray = []
      const groupsRefsToDelete = []
      const promises = []
      const groupPromises = []

      groupsSnapshot.forEach((groupSnapshot) => {
        if (groupSnapshot.exists) {
          const usersRef = groupsRef
            .doc(groupSnapshot.ref.id)
            .collection("users")
            .limit(1)

          const promise = usersRef.get()
          groupPromises.push(promise)
          groupsRefArray.push(groupSnapshot.ref)
        }
      })

      const groupsQuerySnapshot = await Promise.all(groupPromises)

      groupsQuerySnapshot.forEach((usersQuerySnapshot, index) => {
        if (usersQuerySnapshot.empty) {
          groupsRefsToDelete.push(groupsRefArray[index])
        }
      })

      groupsRefsToDelete.forEach((groupRef) => {
        const bulkWriter = database.bulkWriter()
        bulkWriter
          .onWriteError((error) => {
            if (
              error.failedAttempts < MAX_RETRY_ATTEMPTS
            ) {
              return true
            } else {
              console.log('Failed write at document: ', error.documentRef.path)
              return false
            }
          })
        const promise = database.recursiveDelete(groupRef, bulkWriter)
        promises.push()
      })

      await Promise.all(promises)

    } catch (error) {
      console.log("Error deleting empty groups: " + error)
    }
  })

exports.scheduledRewardCheck = functions.pubsub
  .schedule("0 11 * * *")
  .timeZone("Europe/Madrid")
  .onRun(async (context) => {
    const groupRef = database.collection("groups")

    const weekInMillis = 604800000
    const twoWeekInMillis = 1209600000
    const monthInMillis = 2629800000
    const twoMonthInMillis = 5259600000
    const yearInMillis = 31557600000
    const todayDate = new Date(Date.now())

    const rewardsPromises = []
    const userPromises = []
    const rewards = []

    try {
      const groupsSnapshot = await groupRef.get()

      groupsSnapshot.forEach((groupSnapshot) => {
        if (groupSnapshot.exists) {
          const rewardsRef = groupRef
            .doc(groupSnapshot.ref.id)
            .collection("rewards")

          const promise = rewardsRef.get()
          rewardsPromises.push(promise)
        }
      })

      const rewardsSnapshotPromises = await Promise.all(rewardsPromises)

      rewardsSnapshotPromises.forEach((rewardsSnapshot) => {
        rewardsSnapshot.forEach((rewardSnapshot) => {
          const reward = rewardSnapshot.data()
          if (reward.expiration != null) {
            const expirationDate = reward.expiration.toDate()

            const expireDay = expirationDate.getDate()
            const expireMonth = expirationDate.getMonth() + 1
            const expireYear = expirationDate.getFullYear()

            const todayDay = todayDate.getDate()
            const todayMonth = todayDate.getMonth() + 1
            const todayYear = todayDate.getFullYear()

            if ((todayYear == expireYear && todayMonth == expireMonth &&
              todayDay == expireDay && reward.frequency != 0)) {
              rewards.push(reward)
              console.log("Reward: " + reward.name)
              let newFreq
              switch (reward.frequency) {
                case 1:
                  newFreq = new Date(Date.now() + weekInMillis)
                  break
                case 2:
                  newFreq = new Date(Date.now() + twoWeekInMillis)
                  break
                case 3:
                  newFreq = new Date(Date.now() + monthInMillis)
                  break
                case 4:
                  newFreq = new Date(Date.now() + twoMonthInMillis)
                  break
                case 5:
                  newFreq = new Date(Date.now() + yearInMillis)
                  break
              }

              rewardSnapshot.ref.update({
                "creation": todayDate,
                "expiration": newFreq
              })

              const userRef = rewardSnapshot.ref
                .parent.parent
                .collection("users")
                .orderBy("points", "desc")
                .limit(1)

              const promise = userRef.get()
              userPromises.push(promise)
            }
          }
        })
      })

      const usersSnapshotPromises = await Promise.all(userPromises)

      usersSnapshotPromises.forEach((usersSnapshot, index) => {
        usersSnapshot.forEach((userSnapshot) => {
          const user = userSnapshot.data()
          message.token = user.messagingToken
          message.notification.title = "You have won the reward!"
          message.notification.body = "'" + rewards[index].name + "' is for you to claim! Congratulations for " +
            " doing the most work in your group! " +
            "The reward has been reset according to its frequency for the next claim."

          console.log("Sending message: " + JSON.stringify(message))

          admin.messaging().send(message)
            .then((response) => {
              console.log("Successfully sent message: " + response)
            })
            .catch((error) => {
              console.log("Error sending notification: " + error)
            })
        })
      })
    } catch (error) {
      console.log("Error getting the group snapshot: " + error)
    }
  })
