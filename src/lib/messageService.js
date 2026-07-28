//! Feature under review
//TODO
import { ID, Query } from "appwrite"; // Added Query
// import { account, databases } from "./appwrite.js";

// const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID_MESSAGE = "686f7bb40012db746c90"; // Your Profile Collection ID

export const createMessageFromUser = async (text, receiver, messageType) => {
  try {
    // Get the current user's session to use their ID as the sender
    const currentUser = await account.get();
    const senderId = currentUser.$id;
    // const useredata = await getUserByIdService(myUserId);

    const payload = {
      text: text,
      sender: senderId,
      receiver: receiver,
      messageType: messageType,
      timestamp: new Date().toISOString(),
      isRead: false, // Default to false on creation
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_MESSAGE,
      ID.unique(),
      payload
    );
    // console.log("Message created successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to create message:", error);
    throw error;
  }
};
export const createMessageFromCoop = async (
  text,
  receiver,
  messageType,
  coopId
) => {
  try {
    const payload = {
      text: text,
      sender: coopId,
      receiver: receiver,
      messageType: messageType,
      timestamp: new Date().toISOString(),
      isRead: false, // Default to false on creation
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_MESSAGE,
      ID.unique(),
      payload
    );
    // console.log("Message created successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to create message:", error);
    throw error;
  }
};
export const createMessageFromAuditer = async (text, receiver, messageType) => {
  try {
    const payload = {
      text: text,
      sender: "auditer",
      receiver: receiver,
      messageType: messageType,
      timestamp: new Date().toISOString(),
      isRead: false, // Default to false on creation
    };
    // console.log(payload);

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_MESSAGE,
      ID.unique(),
      payload
    );
    // console.log("Message created successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to create message:", error);
    throw error;
  }
};
export const getMessages = async (hostId) => {
  // console.log("hostid", hostId);
  try {
    // Create a query to get all messages where the current user is either the sender or the receiver
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_MESSAGE,
      [
        Query.or([
          Query.equal("sender", hostId),
          Query.equal("receiver", hostId),
        ]),
        Query.orderAsc("timestamp"), // Get the newest messages first
      ]
    );

    const messages = response.documents;
    // console.log("msg",messages)
    // Group messages by the other person in the conversation
    // const groupedMessages = messages.reduce((acc, msg) => {
    //     // Determine the ID of the other party in the conversation
    //     const otherPartyId = msg.sender === hostId ? msg.receiver : msg.sender;

    //     // If there's no group for this party yet, create one
    //     if (!acc[otherPartyId]) {
    //         acc[otherPartyId] = [];
    //     }

    //     // Format the message to match the desired structure
    //     const formattedMessage = {
    //         id: msg.$id,
    //         text: msg.text,
    //         timestamp: msg.timestamp,
    //         sender: msg.sender,
    //         receiver: msg.receiver,
    //         isRead: msg.isRead,
    //         messageType: msg.messageType
    //     };

    //     // Add the formatted message to the correct group
    //     acc[otherPartyId].push(formattedMessage);

    //     return acc;
    // }, {});

    // console.log('Formatted Messages:', groupedMessages);
    return messages;
  } catch (error) {
    console.error("Failed to get messages:", error);
    return {}; // Return an empty object on failure
  }
};
export const markMessageAsRead = async (messageId) => {
  // console.log("reding msg with ", messageId);
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_MESSAGE,
      messageId,
      { isRead: true }
    );
    // console.log(`Message ${messageId} marked as read.`, response);
    return response;
  } catch (error) {
    console.error(`Failed to mark message ${messageId} as read:`, error);
    throw error;
  }
};
