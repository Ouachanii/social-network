"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation"; // Next.js router hook for query params
import "../styles/chat.css";
import UserProfile from "../components/UserProfile";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);

  const searchParams = useSearchParams();
  const otherUserId = searchParams.get("user");

  const [userId, setUserId] = useState(null);

  // Get userId from localStorage or another dynamic source
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Optionally, handle no userId case, e.g., redirect to login
      console.warn("No userId found in localStorage");
    }
  }, []);
console.log(userId, "user" ,otherUserId, "otherUserId");

  useEffect(() => {
    if (!userId) return; // Wait for userId before connecting

    ws.current = new WebSocket(`ws://localhost:8080/ws?userid=${userId}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("Received:", msg);

        if (msg.type === "messageuser" && msg.sender && msg.content) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: msg.content,
              sender: msg.sender,
              time: msg.timestamp,
              isOwn: msg.sender === userId,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [userId]);

  const sendMessage = () => {
    console.log(otherUserId, "herrerre");
    
    if (!otherUserId) {
      alert("No receiver specified in URL!");
      return;
    }
    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg = {
        type: "messageuser",
        sender: userId,
        receiver: [otherUserId],
        content: input,
        groupid: 0,
        notificationid: 0,
        offset: 0,
        timestamp: new Date().toISOString(),
      };

      ws.current.send(JSON.stringify(msg));

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: input,
          sender: "You",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isOwn: true,
        },
      ]);

      setInput("");
    }
  };

  return (
    <div className="main-chat">
      <div className="chat-container">
        <div className="chat-header">
          <h2 className="chat-title">General Chat</h2>
          <p className="chat-subtitle">4 members online</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.isOwn ? "own" : "other"}`}>
              <div className="chat-message-content">
                <div className="chat-message-bubble">
                  {!msg.isOwn && <p className="chat-message-sender">{msg.sender}</p>}
                  <p>{msg.text}</p>
                </div>
                <p className="chat-message-time">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-container">
          <div className="chat-input-form">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            <button onClick={sendMessage} className="chat-send-button">
              Send
            </button>
          </div>
        </div>
      </div>
      <UserProfile />
    </div>
  );
};

export default ChatPage;
