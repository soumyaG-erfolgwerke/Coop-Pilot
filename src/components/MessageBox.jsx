"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  MoreVertical,
  Clock,
  Smile,
  Paperclip,
  Send,
  CheckCheck,
  Lock,
  ArrowLeft,
  X,
  UserPlus,
  Building,
  ShieldCheck,
  MessageSquarePlus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getAllActiveMembersService } from "../lib/allUsersService";
import { getAllCoops } from "../lib/getCoopsService";
import {
  createMessageFromAuditer,
  createMessageFromCoop,
  createMessageFromUser,
  getMessages,
  markMessageAsRead,
} from "../lib/messageService";
import { useAuth } from "../hooks/useAuth";
import useUserCache from "../hooks/useUserCache";
import { initRealtimeMesseging } from "../lib/initRealtimeMessaging";

// --- MOCK DATA & SCHEMA ---
// This data is for demonstration purposes.

const initialContacts = [];
const initialMessages = {};

// --- UTILITY FUNCTIONS ---
const formatTimestamp = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// --- SUB-COMPONENTS ---
const MessageStatus = ({ isRead }) => {
  if (isRead === null || isRead === undefined) {
    return (
      <Clock size={16} className="text-yellow-500" title="Message not sent" />
    );
  }

  return isRead ? (
    <CheckCheck size={16} className="text-teal-300" title="Read" />
  ) : (
    <CheckCheck
      size={16}
      className="text-slate-400"
      title="Delivered but unread"
    />
  );
};

const MessageBubble = ({ message, isMe }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`max-w-sm md:max-w-md lg:max-w-lg px-4 py-2.5 shadow-md rounded-2xl ${
        isMe
          ? "bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-br-none"
          : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none"
      }`}
    >
      <p className="text-sm">{message.text}</p>
      <div className="flex justify-end items-center mt-1.5">
        <span
          className={`text-xs ${
            isMe ? "text-teal-100/80" : "text-slate-500 dark:text-slate-400"
          } mr-1.5`}
        >
          {formatTimestamp(message.timestamp)}
        </span>
        {isMe && <MessageStatus isRead={message.isRead} />}
      </div>
    </div>
  </motion.div>
);

const DateSeparator = ({ date }) => (
  <div className="flex justify-center my-4">
    <div className="px-3 py-1 text-xs rounded-full text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700/50">
      {date}
    </div>
  </div>
);

const SystemMessage = ({ text }) => (
  <div className="flex justify-center my-4">
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-center rounded-full text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-800/30">
      <Lock size={12} />
      <span>{text}</span>
    </div>
  </div>
);

const ChatHeader = ({ contact, onBack }) => (
  <header className="z-10 flex items-center justify-between flex-shrink-0 p-3 border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
    <div className="flex items-center gap-3">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="p-2 transition-colors rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 md:hidden"
      >
        <ArrowLeft size={20} />
      </motion.button>
      <div>
        <h2 className="font-semibold text-md text-slate-800 dark:text-slate-100">
          {contact.name}
        </h2>
        <p className="text-xs text-green-500 dark:text-green-400">Online</p>
      </div>
    </div>
    <div className="flex items-center space-x-1">
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="p-2 transition-colors rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <Search size={20} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="p-2 transition-colors rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <MoreVertical size={20} />
      </motion.button>
    </div>
  </header>
);

const MessageInput = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState("");
  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center flex-shrink-0 gap-3 p-4 border-t bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="p-2 transition-colors rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <Smile size={22} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="p-2 transition-colors rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <Paperclip size={22} />
      </motion.button>
      <div className="relative flex-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="w-full pl-4 pr-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-900/70 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
        />
      </div>
      <motion.button
        onClick={handleSend}
        disabled={!inputValue.trim()}
        className="p-3 text-white transition-all duration-300 bg-teal-500 rounded-full hover:bg-teal-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
        whileTap={{ scale: inputValue.trim() ? 0.95 : 1 }}
      >
        <Send size={20} />
      </motion.button>
    </div>
  );
};

// UPDATED: Added MY_USER_ID to props
const ChatBox = ({ contact, messages, onSendMessage, onBack, MY_USER_ID }) => {
  // 1. Use a ref for the scrollable container itself.
  const scrollContainerRef = useRef(null);

  // This effect now scrolls instantly to the bottom.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Instantly set the scroll position to the bottom
      container.scrollTop = container.scrollHeight;
    }

    function readMsg() {
      messages.forEach((message) => {
        console.log(
          message.text,
          message.sender !== MY_USER_ID,
          !message.isRead
        );
        if (message.sender !== MY_USER_ID && !message.isRead) {
          console.log("readmsg", message.text);
          markMessageAsRead(message.id);
        }
      });
    }
    readMsg();
  }, [messages]); // Runs whenever messages change

  const renderMessagesWithDateSeparators = () => {
    // ... (this function remains unchanged)
    const messageElements = [];
    let lastDateString = null;
    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const messageDateString = messageDate.toDateString();
      if (messageDateString !== lastDateString) {
        const formattedDate = messageDate.toLocaleDateString([], {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        messageElements.push(
          <DateSeparator
            key={`date_${messageDateString}`}
            date={formattedDate}
          />
        );
        lastDateString = messageDateString;
      }
      messageElements.push(
        <MessageBubble
          key={message.id}
          message={message}
          isMe={message.sender === MY_USER_ID}
        />
      );
    });
    return messageElements;
  };

  if (!contact) {
    return (
      <div className="flex-col items-center justify-center hidden h-full md:flex bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <MessageSquarePlus
            size={64}
            className="mx-auto mb-4 text-slate-400 dark:text-slate-500"
          />
          <h2 className="text-2xl font-medium">Welcome to Secure Chat</h2>
          <p>Select a conversation to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <ChatHeader contact={contact} onBack={onBack} />
      {/* 3. Attach the ref to the scrollable div */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-slate-800 custom-scrollbar"
      >
        <SystemMessage text="Messages are not end-to-end encrypted" />
        <div className="space-y-4">{renderMessagesWithDateSeparators()}</div>
        {/* The extra div with messagesEndRef is no longer needed */}
      </div>
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
};
const ContactItem = ({
  contact,
  lastMessage,
  unreadCount,
  isActive,
  onSelect,
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.2, type: "spring", stiffness: 200, damping: 25 }}
    onClick={onSelect}
    className={`flex items-center p-3 cursor-pointer rounded-lg transition-colors duration-200 relative ${
      isActive
        ? "bg-slate-200 dark:bg-slate-700/60"
        : "hover:bg-slate-100 dark:hover:bg-slate-700/30"
    }`}
  >
    {isActive && (
      <motion.div
        layoutId="active-contact-indicator"
        className="absolute top-0 bottom-0 left-0 w-1 bg-teal-500 rounded-l-lg"
      />
    )}
    <div className="flex-1 pl-2 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold truncate text-slate-800 dark:text-slate-100">
          {contact.name}
        </h3>
        <span className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
          {formatTimestamp(lastMessage?.timestamp)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <p
          className={`text-sm text-slate-600 dark:text-slate-300 truncate ${
            unreadCount > 0
              ? "font-bold text-slate-800 dark:text-slate-100"
              : ""
          }`}
        >
          {lastMessage?.text || "No messages yet"}
        </p>
        {unreadCount > 0 && (
          <span className="flex items-center justify-center flex-shrink-0 w-5 h-5 text-xs font-bold text-white bg-teal-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

// UPDATED: Added MY_USER_ID to props
const ContactList = ({
  contacts,
  messagesByContact,
  selectedContactId,
  onSelectContact,
  onAddContact,
  MY_USER_ID,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const existingContactIds = useMemo(
    () => contacts.map((c) => c.id),
    [contacts]
  );

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const lastMsgA =
        messagesByContact[a.id]?.[messagesByContact[a.id].length - 1];
      const lastMsgB =
        messagesByContact[b.id]?.[messagesByContact[b.id].length - 1];
      if (!lastMsgA) return 1;
      if (!lastMsgB) return -1;
      return new Date(lastMsgB.timestamp) - new Date(lastMsgA.timestamp);
    });
  }, [contacts, messagesByContact]);

  const handleAddContact = (contact) => {
    onAddContact(contact);
    setIsModalOpen(false);
  };

  // Mock auditor data for the modal
  const theAuditor = {
    id: "auditor-1",
    name: "Financial Auditors Inc.",
    type: "auditor",
  };

  return (
    <>
      <AddContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddContact={handleAddContact}
        existingContactIds={existingContactIds}
        theAuditor={theAuditor} // Pass mock auditor data to the modal
      />
      <div className="flex flex-col h-full bg-white border-r dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Chats
          </h2>
          <motion.button
            onClick={() => setIsModalOpen(true)}
            whileTap={{ scale: 0.9 }}
            className="p-2 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            aria-label="Add new contact"
          >
            <UserPlus size={20} />
          </motion.button>
        </div>
        <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {sortedContacts.map((contact) => {
              const messages = messagesByContact[contact.id] || [];
              const lastMessage = messages[messages.length - 1];
              // UPDATED: Now uses the MY_USER_ID prop to calculate the unread count
              const unreadCount = messages.filter(
                (m) => !m.isRead && m.sender !== MY_USER_ID
              ).length;
              return (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  lastMessage={lastMessage}
                  unreadCount={unreadCount}
                  isActive={contact.id === selectedContactId}
                  onSelect={() => onSelectContact(contact.id)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

// --- ADD CONTACT MODAL SUB-COMPONENTS ---
const AddListItem = ({ contact, onAdd }) => (
  <motion.div
    layout
    variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors duration-200"
  >
    <span className="font-medium text-slate-800 dark:text-slate-200">
      {contact.name}
    </span>
    <motion.button
      onClick={() => onAdd(contact)}
      whileTap={{ scale: 0.95 }}
      className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-teal-500 text-white rounded-lg hover:bg-teal-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75"
    >
      <UserPlus size={16} /> Add
    </motion.button>
  </motion.div>
);

const ContactListSection = ({
  title,
  availableContacts,
  onAddContact,
  initialEmptyMessage,
  SectionIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredContacts = useMemo(
    () =>
      availableContacts.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, availableContacts]
  );

  const listVariants = {
    visible: {
      opacity: 1,
      transition: { when: "beforeChildren", staggerChildren: 0.05 },
    },
    hidden: { opacity: 0 },
  };

  return (
    <div className="flex flex-col p-4 space-y-3 border bg-slate-100 dark:bg-slate-800/50 rounded-xl border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <SectionIcon />{" "}
        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h4>
      </div>
      {availableContacts.length > 0 ? (
        <>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={20} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${title}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 transition-all bg-white border rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="pr-2 space-y-1 overflow-y-auto max-h-36 custom-scrollbar"
          >
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <AddListItem
                  key={contact.id}
                  contact={contact}
                  onAdd={onAddContact}
                />
              ))
            ) : (
              <p className="px-2 py-4 text-sm text-center text-slate-500 dark:text-slate-400">
                No results found.
              </p>
            )}
          </motion.div>
        </>
      ) : (
        <p className="px-2 text-sm text-slate-500 dark:text-slate-400">
          {initialEmptyMessage}
        </p>
      )}
    </div>
  );
};

const AddContactModal = ({
  isOpen,
  onClose,
  onAddContact,
  existingContactIds,
  theAuditor,
}) => {
  const [allUsers, setAllUsers] = useState([]);
  const [allCooperatives, setAllCooperatives] = useState([]);
  const { getUserById } = useUserCache();

  // Fetch users and cooperatives once when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const usersData = await getAllActiveMembersService();
        const coopsData = await getAllCoops();
        setAllUsers(usersData);
        setAllCooperatives(coopsData);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    fetchData();
  }, [isOpen]);

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !existingContactIds.includes(u.id)),
    [allUsers, existingContactIds]
  );
  const availableCoops = useMemo(
    () => allCooperatives.filter((c) => !existingContactIds.includes(c.id)),
    [allCooperatives, existingContactIds]
  );
  const isAuditorAvailable = useMemo(
    () => theAuditor && !existingContactIds.includes(theAuditor.id),
    [theAuditor, existingContactIds]
  );

  const modalVariants = {
    hidden: { opacity: 0, y: -40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 25 },
    },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
          >
            <header className="flex items-center justify-between flex-shrink-0 p-5 border-b bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Add New Contact
              </h3>
              <motion.button
                whileTap={{ scale: 0.9, rotate: 180 }}
                onClick={onClose}
                className="p-1 transition-colors rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={24} />
              </motion.button>
            </header>

            <main className="p-5 space-y-5 overflow-y-auto bg-white custom-scrollbar dark:bg-slate-900">
              <ContactListSection
                title="Users"
                availableContacts={availableUsers}
                onAddContact={onAddContact}
                initialEmptyMessage="All users have been added."
                SectionIcon={() => (
                  <UserPlus
                    size={18}
                    className="text-teal-500 dark:text-teal-400"
                  />
                )}
              />

              <ContactListSection
                title="Cooperatives"
                availableContacts={availableCoops}
                onAddContact={onAddContact}
                initialEmptyMessage="All cooperatives have been added."
                SectionIcon={() => (
                  <Building
                    size={18}
                    className="text-teal-500 dark:text-teal-400"
                  />
                )}
              />

              {theAuditor && (
                <div className="p-4 border bg-slate-100 dark:bg-slate-800/50 rounded-xl border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck
                      size={18}
                      className="text-teal-500 dark:text-teal-400"
                    />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Auditor
                    </h4>
                  </div>
                  {isAuditorAvailable ? (
                    <AddListItem contact={theAuditor} onAdd={onAddContact} />
                  ) : (
                    <p className="px-2 text-sm text-slate-500 dark:text-slate-400">
                      Auditor has already been added.
                    </p>
                  )}
                </div>
              )}
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const groupMessagesByContact = (messages, hostId) => {
  // Step 1: Group all messages by the other party's ID using reduce.
  const groupedMessages = messages.reduce((acc, msg) => {
    const otherPartyId = msg.sender === hostId ? msg.receiver : msg.sender;

    if (!acc[otherPartyId]) {
      acc[otherPartyId] = [];
    }

    const formattedMessage = {
      id: msg.$id,
      text: msg.text,
      timestamp: msg.timestamp,
      sender: msg.sender,
      receiver: msg.receiver,
      isRead: msg.isRead,
      messageType: msg.messageType,
    };

    acc[otherPartyId].push(formattedMessage);
    return acc;
  }, {});

  // Step 2: Iterate over each contact in the grouped object.
  for (const contactId in groupedMessages) {
    // Sort the array of messages for the current contact in-place.
    groupedMessages[contactId].sort((a, b) => {
      // Convert timestamps to Date objects for accurate comparison.
      // This sorts the messages in ascending chronological order (oldest to newest).
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }

  // Step 3: Return the object with sorted message arrays.
  return groupedMessages;
};

// --- MAIN APP COMPONENT ---
export default function MessageBox({ messageType, coopid = null }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [messagesByContact, setMessagesByContact] = useState(initialMessages);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [MY_USER_ID, setMY_USER_ID] = useState(null);
  const { user } = useAuth();
  const { getUserById, getAllUsers } = useUserCache();
  const [globalContacts, setGlobalContacts] = useState({});
  const [msgPool, setMsgPool] = useState([]);

  useEffect(() => {
    if (messageType === "personal" && user?.$id) {
      setMY_USER_ID(user.$id);
    } else if (messageType === "coop" && coopid) {
      setMY_USER_ID(coopid);
    } else if (messageType === "auditer") {
      setMY_USER_ID("auditer");
    }
    // console.log("my userid changed", MY_USER_ID)
  }, [coopid]);

  useEffect(() => {
    async function fetchGlobalContacts() {
      try {
        // Fetch both sets of data
        const allusercache = await getAllUsers();
        const allcoops = await getAllCoops(); // Assuming this returns an array of objects with 'id' and 'name'

        // Create a new object to hold the combined data
        const contactsMap = {};

        // Process users: Add each user to the map with id as key and name as value
        allusercache.forEach((user) => {
          if (user.id && user.name) {
            contactsMap[user.id] = {
              id: user.id,
              name: user.name,
            };
          }
        });

        // Process co-ops: Add each co-op to the map
        // Note: This assumes 'allcoops' is an array of objects like [{id: '...', name: '...'}]
        if (Array.isArray(allcoops)) {
          allcoops.forEach((coop) => {
            if (coop.id && coop.name) {
              contactsMap[coop.id] = {
                id: coop.id,
                name: coop.name,
              };
            }
          });
        }
        contactsMap["auditer"] = {
          id: "auditer",
          name: "Auditer",
        };
        // Update the state with the combined contacts object
        setGlobalContacts(contactsMap);
      } catch (error) {
        console.error("Failed to fetch global contacts:", error);
      }
    }
    fetchGlobalContacts();
  }, []);

  useEffect(() => {
    // Define how to handle incoming real-time events
    const handleCreate = (newMessage) => {
      // Add the new message to the end of our messages array
      setMsgPool((prevMessages) => [...prevMessages, newMessage]);
    };

    const handleUpdate = (updatedMessage) => {
      // Find the message by its ID and replace it with the updated version
      setMsgPool((prevMessages) =>
        prevMessages.map((msg) =>
          msg.$id === updatedMessage.$id ? updatedMessage : msg
        )
      );
    };

    // 1. Call the function to start the subscription when the component mounts.
    const unsubscribe = initRealtimeMesseging({
      onCreate: handleCreate,
      onUpdate: handleUpdate,
      currentid: MY_USER_ID,
    });

    console.log("Real-time subscription initiated.");

    // 2. Return the unsubscribe function as the cleanup function.
    //    React will automatically call this when the component unmounts.
    return () => {
      unsubscribe();
      console.log("Real-time subscription terminated.");
    };
  }, [MY_USER_ID]);

  useEffect(() => {
    // console.log("useeffect", MY_USER_ID, globalContacts)
    if (MY_USER_ID == null) return;
    async function fetchMessages() {
      const allMessages = await getMessages(MY_USER_ID);
      // console.log("allmsg", allMessages);
      setMsgPool(allMessages);
    }
    fetchMessages();
  }, [MY_USER_ID, globalContacts]);

  useEffect(() => {
    // console.log("msgpool", msgPool);
    setMessagesByContact(groupMessagesByContact(msgPool, MY_USER_ID));
  }, [msgPool]);

  useEffect(() => {
    let contactArray = [];
    Object.keys(messagesByContact).forEach((key) => {
      const u = globalContacts[key];
      // console.log("chat", key, u)
      contactArray.push({ id: key, ...u });
    });
    setContacts(contactArray);
  }, [messagesByContact]);

  const handleSelectContact = (contactId) => {
    setSelectedContactId(contactId);
    setMessagesByContact((prev) => {
      const newMessages = (prev[contactId] || []).map((msg) =>
        msg.sender !== MY_USER_ID ? { ...msg, isRead: true } : msg
      );
      return { ...prev, [contactId]: newMessages };
    });
  };

  const handleAddContact = (newContact) => {
    if (!contacts.find((c) => c.id === newContact.id)) {
      setContacts((prevContacts) => [newContact, ...prevContacts]);
      handleSelectContact(newContact.id);
    }
  };

  const handleSendMessage = (text) => {
    if (!selectedContactId || !MY_USER_ID) return;

    // 1. Create a new message with a unique, temporary ID.
    const tempMessage = {
      id: `msg_${Date.now()}`, // The temporary ID
      sender: MY_USER_ID,
      text,
      timestamp: new Date().toISOString(),
      isRead: null, // Indicates the message is being sent
    };

    // 2. Optimistically add the temporary message to the UI.
    setMessagesByContact((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), tempMessage],
    }));

    // 3. Define a success handler to replace the temporary message.
    //    We assume 'response' is the final message object from your server.
    const handleSuccess = (finalMessage) => {
      console.log("Message sent successfully. Updating UI with server data.");
      setMessagesByContact((prev) => {
        // Find the temporary message by its ID and replace it with the final one.
        const updatedMessages = (prev[selectedContactId] || []).map((msg) =>
          msg.id === tempMessage.id ? finalMessage : msg
        );
        return {
          ...prev,
          [selectedContactId]: updatedMessages,
        };
      });
      // // You can still use setMessageRead if it performs a separate action.
      // setMessageRead(finalMessage);
    };

    // 4. (Recommended) Define an error handler to remove the temporary message on failure.
    const handleError = (error) => {
      console.error("Failed to send message:", error);
      // Rollback: Remove the optimistic message that failed to send.
      setMessagesByContact((prev) => ({
        ...prev,
        [selectedContactId]: (prev[selectedContactId] || []).filter(
          (msg) => msg.id !== tempMessage.id
        ),
      }));
    };

    // 5. Call the appropriate API and use the handlers.
    if (messageType === "coop") {
      createMessageFromCoop(text, selectedContactId, messageType, coopid)
        .then(handleSuccess)
        .catch(handleError);
    } else if (messageType === "personal") {
      createMessageFromUser(text, selectedContactId, messageType)
        .then(handleSuccess)
        .catch(handleError);
    } else if (messageType === "auditer") {
      createMessageFromAuditer(text, selectedContactId, messageType)
        .then(handleSuccess)
        .catch(handleError);
    }
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const selectedContactMessages = messagesByContact[selectedContactId] || [];

  const CustomScrollbarStyles = () => (
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      html.dark .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #4a5568;
        border-radius: 20px;
      }
      html:not(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #cbd5e0;
        border-radius: 20px;
      }
      html.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #718096;
      }
      html:not(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #a0aec0;
      }
    `}</style>
  );

  return (
    <div className="w-full my-2 h-[80vh] font-sans transition-colors duration-300 bg-white dark:bg-slate-900 overflow-hidden  rounded-lg border border-slate-200 dark:border-slate-700">
      <CustomScrollbarStyles />
      <div className="flex h-full">
        <div
          className={`w-full md:w-1/3 lg:w-1/4 md:max-w-sm flex-shrink-0 h-full transition-transform duration-300 ease-in-out ${
            selectedContactId ? "-translate-x-full" : "translate-x-0"
          } md:translate-x-0`}
        >
          <ContactList
            contacts={contacts}
            messagesByContact={messagesByContact}
            selectedContactId={selectedContactId}
            onSelectContact={handleSelectContact}
            onAddContact={handleAddContact}
            MY_USER_ID={MY_USER_ID} // Prop passed down
          />
        </div>
        <div
          className={`absolute top-0 left-0 w-full h-full md:static md:flex-1 transition-transform duration-300 ease-in-out ${
            selectedContactId ? "translate-x-0" : "translate-x-full"
          } md:translate-x-0`}
        >
          <ChatBox
            contact={selectedContact}
            messages={selectedContactMessages}
            onSendMessage={handleSendMessage}
            onBack={() => setSelectedContactId(null)}
            MY_USER_ID={MY_USER_ID} // Prop passed down
          />
        </div>
      </div>
    </div>
  );
}
