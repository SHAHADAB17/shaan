const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
setGlobalOptions({ region: "asia-south1", maxInstances: 10 });

const db = getFirestore();

function previewForMessage(data) {
  if (data.type === "image") return "🖼️ Photo";
  if (data.type === "file") return `📄 ${data.fileName || "Document"}`.slice(0, 120);
  if (data.type === "audio") return "🎤 Voice message";
  return String(data.text || "New message").replace(/\s+/g, " ").trim().slice(0, 120);
}

async function getRecipient(uid, senderId) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) return null;
  const user = snap.data() || {};
  const blocked = Array.isArray(user.blockedUsers) && user.blockedUsers.includes(senderId);
  const enabled = user.notificationSettings?.enabled !== false;
  const tokens = Array.isArray(user.fcmTokens) ? user.fcmTokens.filter(Boolean) : [];
  if (blocked || !enabled || !tokens.length) return null;
  return { uid, user, tokens };
}

async function sendToRecipients(recipients, payload) {
  for (const recipient of recipients) {
    if (!recipient.tokens.length) continue;

    const response = await getMessaging().sendEachForMulticast({
      tokens: recipient.tokens,
      data: Object.fromEntries(
        Object.entries(payload.data || {}).map(([k, v]) => [k, String(v ?? "")])
      ),
      webpush: {
        headers: { Urgency: payload.urgency || "high" }
      }
    });

    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token")
        ) invalidTokens.push(recipient.tokens[i]);
      }
    });

    if (invalidTokens.length) {
      await db.doc(`users/${recipient.uid}`).update({
        fcmTokens: FieldValue.arrayRemove(...invalidTokens)
      }).catch(() => {});
    }
  }
}

exports.notifyNewMessage = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const message = event.data?.data();
    if (!message || !message.senderId) return;

    const chatId = event.params.chatId;
    const senderId = message.senderId;
    const chatSnap = await db.doc(`chats/${chatId}`).get();
    const chat = chatSnap.exists ? chatSnap.data() || {} : {};

    let recipientIds = [];
    if (chat.type === "group" || Array.isArray(chat.participants) && chat.participants.length > 2) {
      recipientIds = (chat.participants || []).filter((uid) => uid !== senderId);
    } else if (message.receiverId) {
      recipientIds = [message.receiverId];
    } else {
      recipientIds = (chat.participants || []).filter((uid) => uid !== senderId);
    }

    const senderSnap = await db.doc(`users/${senderId}`).get();
    const sender = senderSnap.exists ? senderSnap.data() || {} : {};
    const senderName = message.senderName || sender.name || "User";
    const preview = previewForMessage(message);

    const recipients = [];
    for (const uid of [...new Set(recipientIds)]) {
      const recipient = await getRecipient(uid, senderId);
      if (recipient) recipients.push(recipient);
    }

    if (!recipients.length) return;

    const title = chat.type === "group" && chat.name
      ? `${senderName} · ${chat.name}`
      : senderName;

    await sendToRecipients(recipients, {
      data: {
        type: "message",
        title,
        body: preview,
        senderId,
        senderName,
        chatId,
        icon: sender.photoURL || "",
        tag: `message-${chatId}`
      }
    });
  }
);

exports.notifyIncomingCall = onDocumentCreated(
  "calls/{callId}",
  async (event) => {
    const call = event.data?.data();
    if (!call || call.status !== "ringing" || !call.calleeId || !call.callerId) return;

    const recipient = await getRecipient(call.calleeId, call.callerId);
    if (!recipient) return;

    const callerSnap = await db.doc(`users/${call.callerId}`).get();
    const caller = callerSnap.exists ? callerSnap.data() || {} : {};
    const callerName = call.callerName || caller.name || "User";
    const callType = call.type === "video" ? "video" : "voice";

    await sendToRecipients([recipient], {
      data: {
        type: "call",
        title: callerName,
        body: callType === "video" ? "Incoming video call" : "Incoming voice call",
        callId: call.callId || event.params.callId,
        callerId: call.callerId,
        callerName,
        callType,
        icon: call.callerPhotoURL || caller.photoURL || "",
        tag: `call-${call.callId || event.params.callId}`
      }
    });
  }
);
