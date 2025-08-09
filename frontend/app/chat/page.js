"use client";
import React, { useState, useEffect, useRef } from "react";
import "../styles/chat.css";
import UserProfile from "../components/UserProfile";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    // initial dummy messages, optional
  ]);
  const [input, setInput] = useState("");
  const ws = useRef(null); // hold websocket instance

  // Replace this with actual userId (maybe from auth or route param)
  const userId = "14"; 
  // Replace this with the other user's ID you want to chat with
  const otherUserId = "7";

  useEffect(() => {
    // Connect to your WebSocket server with the userId as a query param
    ws.current = new WebSocket(`ws://localhost:8080/ws?userid=${userId}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("Received:", msg);

      // Only handle user messages here
      if (msg.Type === "messageuser" && msg.Sender && msg.Content) {
        // Add new incoming message to the list
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 1,
            text: msg.Content,
            sender: msg.Sender,
            time: msg.Timestamp,
            isOwn: msg.Sender === userId,
          },
        ]);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Clean up on unmount
    return () => {
      ws.current.close();
    };
  }, [userId]);

  const sendMessage = () => {
    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Construct message in the format your Go backend expects
      const msg = {
        Type: "messageuser",
        Sender: userId,
        Receivers: [otherUserId],
        Content: input,
        Groupid: 0,
        Notificationid: 0,
        Offset: 0,
        Timestamp: new Date().toISOString(),
      };

      // Send message as JSON string
      ws.current.send(JSON.stringify(msg));

      // Optimistically add message to UI
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: input,
          sender: "You",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
            <div
              key={msg.id}
              className={`chat-message ${msg.isOwn ? "own" : "other"}`}
            >
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















// import React, { useEffect, useRef, useState } from "react";

// export default function ChatPage() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const ws = useRef(null);

//   useEffect(() => {
//     ws.current = new WebSocket("ws://localhost:8080/ws");
//     ws.current.onmessage = (event) => {
//       setMessages((prev) => [...prev, event.data]);
//     };
//     return () => ws.current.close();
//   }, []);

//   const sendMessage = () => {
//     ws.current.send(input);
//     setInput("");
//   };

//   return (
//     <div className="chat-page">
//       <h2>Chat</h2>
//       <div className="messages">
//         {messages.map((msg, i) => (
//           <div key={i}>{msg}</div>
//         ))}
//       </div>
//       <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." />
//       <button onClick={sendMessage}>Send</button>
//     </div>
//   );
// }
