import React, { useState, useEffect, useRef } from "react";
import Navbar from "../component/Navbar";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAllUsers,
  fetchUserOnlineStatus,
  addMessage,
  setSocket,
  setUserOnlineStatus,
} from "../feature/chatSlice";
import { io } from "socket.io-client";
import {
  generateRandomAESKey,
  encryptMessageWithAES,
  encryptAESKeyWithPublicKey,
  decryptAESKeyWithPrivateKey,
  decryptMessageWithAES,
  getPublicKeyFromIndexedDB,
  fetchPublicKey,
  getPrivateKeyFromIndexedDB,
} from "../utils/keyUtils";
import { usePrivateKeyManager } from "../hooks/usePrivateKeyManager";
import {
  saveMessageLocally,
  getMessagesForUser,
} from "../utils/messageStore.js";

export default function ChatPage() {
  const now = new Date().toISOString();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users, messages, socket } = useSelector((state) => state.chat);

  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [privateKeyBase64, setPrivateKeyBase64] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});

  const privateKeyRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { setupKeys } = usePrivateKeyManager();

  // Keep ref synced
  useEffect(() => {
    privateKeyRef.current = privateKeyBase64;
  }, [privateKeyBase64]);

  // Auto-scroll messages (only chat area)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  // Ensure key setup and load private key
  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const result = await setupKeys(user._id);
        if (result) {
          setPrivateKeyBase64(result);
          return;
        }
        const pk = await getPrivateKeyFromIndexedDB(user._id);
        if (pk) setPrivateKeyBase64(pk);
      } catch (err) {
        console.error("Key setup failed:", err);
      }
    })();
  }, [user]);

  // Fetch all users and online status
  useEffect(() => {
    if (!user?._id) return;
    dispatch(fetchAllUsers()).then((res) => {
      if (res.payload) {
        res.payload.forEach((u) => dispatch(fetchUserOnlineStatus(u._id)));
      }
    });
  }, [dispatch, user]);

  // Auto refresh online status
  useEffect(() => {
    if (!users.length) return;
    const interval = setInterval(() => {
      users.forEach((u) => dispatch(fetchUserOnlineStatus(u._id)));
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch, users]);

  const base64ToUint8Array = (b64) => {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const waitForPrivateKey = (timeout = 3000) =>
    new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (privateKeyRef.current) {
          clearInterval(interval);
          resolve(privateKeyRef.current);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });

  // Fetch + decrypt persisted messages
  useEffect(() => {
    if (!selectedUser || !user) return;
    const loadMessages = async () => {
      try {
        if (messages[selectedUser._id]?.length) return;
        const res = await fetch(
          `/api/v1/chatService/get-message/${selectedUser._id}/${user._id}`,
          { credentials: "include" }
        );
        const data = await res.json();
        const encryptedMessages =
          data && data.success && Array.isArray(data.data) ? data.data : [];

        const localMessages = await getMessagesForUser(
          user._id,
          selectedUser._id
        );

        const decrypted = [];
        for (const msg of encryptedMessages) {
          try {
            const pk = privateKeyRef.current || (await waitForPrivateKey());
            if (!pk) continue;

            const aesKey = await decryptAESKeyWithPrivateKey(
              msg.encryptedAESKey,
              pk
            );

            const ivBytes = Array.isArray(msg.iv)
              ? new Uint8Array(msg.iv)
              : base64ToUint8Array(msg.iv);

            const text = await decryptMessageWithAES(
              aesKey,
              msg.encryptedMessage,
              ivBytes
            );

            decrypted.push({
              from: msg.senderId === user._id ? "me" : msg.senderId,
              text,
              createdAt: msg.createdAt,
            });
          } catch {
            decrypted.push({
              from: msg.senderId === user._id ? "me" : msg.senderId,
              text: "🔒 Encrypted (undecryptable)",
              createdAt: msg.createdAt,
            });
          }
        }

        const merged = [...decrypted, ...localMessages].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        merged.forEach((m) =>
          dispatch(
            addMessage({
              toUserId: selectedUser._id,
              message: { from: m.from, text: m.text },
            })
          )
        );
      } catch (err) {
        console.error("❌ Prefill message failed:", err);
      }
    };

    loadMessages();
  }, [selectedUser, user, dispatch, messages]);

  // Socket setup
  useEffect(() => {
    if (!user) return;
    const socketClient = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    dispatch(setSocket(socketClient));

    socketClient.on("receive-message", async (msg) => {
      try {
        const pk = privateKeyRef.current || (await waitForPrivateKey());
        if (!pk) {
          dispatch(
            addMessage({
              toUserId: msg.from,
              message: { from: msg.from, text: "🔒 Encrypted (key not ready)" },
            })
          );
          if (msg.from !== selectedUser?._id)
            setUnreadMessages((prev) => ({ ...prev, [msg.from]: true }));
          return;
        }

        let ivBytes;
        if (typeof msg.iv === "string") ivBytes = base64ToUint8Array(msg.iv);
        else if (Array.isArray(msg.iv)) ivBytes = new Uint8Array(msg.iv);

        const aesKey = await decryptAESKeyWithPrivateKey(msg.encryptedAESKey, pk);
        const text = await decryptMessageWithAES(aesKey, msg.encryptedMessage, ivBytes);

        dispatch(addMessage({ toUserId: msg.from, message: { from: msg.from, text } }));

        if (msg.from !== selectedUser?._id)
          setUnreadMessages((prev) => ({ ...prev, [msg.from]: true }));
      } catch (err) {
        console.error("❌ Decryption failed:", err);
        dispatch(
          addMessage({
            toUserId: msg.from,
            message: { from: msg.from, text: "🔒 Undecryptable message" },
          })
        );
        if (msg.from !== selectedUser?._id)
          setUnreadMessages((prev) => ({ ...prev, [msg.from]: true }));
      }
    });

    socketClient.on("user-online", ({ userId, isOnline }) => {
      dispatch(setUserOnlineStatus({ userId, isOnline }));
    });

    return () => socketClient.disconnect();
  }, [user, dispatch, selectedUser]);

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (userItem) => {
    setSelectedUser(userItem);
    setUnreadMessages((prev) => ({ ...prev, [userItem._id]: false }));
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser || !socket) return;
    try {
      let receiverPublicKey = await getPublicKeyFromIndexedDB(selectedUser._id);
      if (!receiverPublicKey) {
        receiverPublicKey = await fetchPublicKey(
          selectedUser.email,
          selectedUser._id
        );
        if (!receiverPublicKey) return;
      }

      const aesKey = await generateRandomAESKey();
      const { encryptedMessage, iv } = await encryptMessageWithAES(
        aesKey,
        messageInput.trim()
      );
      const encryptedAESKey = await encryptAESKeyWithPublicKey(
        aesKey,
        receiverPublicKey
      );

      socket.emit("send-message", {
        to: selectedUser._id,
        encryptedMessage,
        encryptedAESKey,
        iv,
        createdAt: now,
      });

      await saveMessageLocally(
        user._id,
        selectedUser._id,
        messageInput.trim(),
        new Date().toISOString()
      );

      dispatch(
        addMessage({
          toUserId: selectedUser._id,
          message: { from: "me", text: messageInput.trim() },
        })
      );

      setMessageInput("");
    } catch (err) {
      console.error("❌ Encryption/send failed:", err);
    }
  };

  return (
    <div className="bg-black text-white flex h-screen overflow-hidden pt-16">
      <Navbar onSearchChange={(val) => setSearchTerm(val)} />

      {/* Sidebar */}
      <div className="w-1/4 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-4 font-bold text-xl border-b border-gray-700 flex-shrink-0">
          Users
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.map((userItem) => (
            <div
              key={userItem._id}
              onClick={() => handleSelectUser(userItem)}
              className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-700 transition ${
                selectedUser?._id === userItem._id ? "bg-gray-700" : ""
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  userItem.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <span className="font-medium relative">
                {userItem.fullname || userItem.username}
                {unreadMessages[userItem._id] && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col bg-gray-800 h-full">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold text-lg">{selectedUser.fullname}</h2>
              <p>{selectedUser.username}</p>
              <span
                className={`text-sm ${
                  selectedUser.isOnline ? "text-green-500" : "text-gray-400"
                }`}
              >
                {selectedUser.isOnline ? "Online" : "Offline"}
              </span>
            </div>

            {/* Chat body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar">
              {(messages[selectedUser._id] || []).length === 0 ? (
                <p className="text-gray-400 text-center mt-10">
                  Start chatting with {selectedUser.username} 💬
                </p>
              ) : (
                (messages[selectedUser._id] || []).map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.from === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-[70%] break-words ${
                        msg.from === "me"
                          ? "bg-yellow-600 text-black"
                          : "bg-white text-black"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Fixed Send Area */}
            <div className="p-4 border-t border-gray-700 flex gap-2 bg-gray-800 flex-shrink-0">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 border rounded-xl px-4 py-2 focus:outline-none bg-gray-700 text-white placeholder-gray-400"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-xl font-semibold"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a user to start chatting 💬
          </div>
        )}
      </div>
    </div>
  );
}
