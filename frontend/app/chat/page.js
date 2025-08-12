"use client";
import { useState } from "react";
import "../styles/chat.css"; // Assuming you have a CSS file for styling
import UserProfile from "../components/UserProfile";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! How's everyone doing today?", sender: "Alice", time: "2:30 PM", isOwn: false },
    { id: 2, text: "Great! Just finished working on a new project", sender: "You", time: "2:32 PM", isOwn: true },
    { id: 3, text: "That sounds awesome! What kind of project?", sender: "Bob", time: "2:33 PM", isOwn: false },
    { id: 4, text: "A social networking app with real-time chat!", sender: "You", time: "2:35 PM", isOwn: true },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: input,
        sender: "You",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };
      setMessages([...messages, newMessage]);
      setInput("");
    }
  };

  // const handleKeyPress = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Enter') {
  //     sendMessage();
  //   }
  // };
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
              className={`chat-message ${msg.isOwn ? 'own' : 'other'}`}
            >
              <div className="chat-message-content">
                <div className="chat-message-bubble">
                  {!msg.isOwn && (
                    <p className="chat-message-sender">{msg.sender}</p>
                  )}
                  <p>{msg.text}</p>
                </div>
                <p className="chat-message-time">
                  {msg.time}
                </p>
              </div>
              <div className="chat-message-avatar">
                {/* <User className="chat-message-avatar-icon" /> */}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-container">
          <div className="chat-input-form">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              // onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button
              onClick={sendMessage}
              className="chat-send-button"
            >
              {/* <Send className="chat-send-icon" /> */}
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
