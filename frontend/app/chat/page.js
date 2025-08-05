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

import PostCard from "./PostCard";
import styles from "./chat.module.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Video, Smile } from "lucide-react";
import { useState } from "react";

const ChatPage = () => {
  const [posts] = useState([
    {
      id: 1,
      author: "Sarah Johnson",
      content: "Just launched my new portfolio website! Excited to share my latest design work with everyone. The journey of becoming a UI/UX designer has been incredible so far 🎨",
      timestamp: "2 hours ago",
      likes: 24,
      comments: 8
    },
    {
      id: 2,
      author: "Mike Chen",
      content: "Beautiful sunset from my morning run today. There's something magical about starting the day with nature's artwork. Hope everyone has an amazing day ahead!",
      timestamp: "4 hours ago",
      likes: 42,
      comments: 12
    },
    {
      id: 3,
      author: "Emily Rodriguez",
      content: "Team meeting went great today! We're making excellent progress on the new app features. Collaboration really makes the dream work 💪",
      timestamp: "6 hours ago",
      likes: 18,
      comments: 5
    }
  ]);

  return (
    <div className={styles.feedContainer}>
      {/* Create Post */}
      <Card className={styles.createPostCard}>
        <div className={styles.createPostContent}>
          <Textarea
            placeholder="What's on your mind?"
            className={styles.createPostTextarea}
            rows={3}
          />
          <div className={styles.createPostActions}>
            <div className={styles.createPostButtons}>
              <Button variant="ghost" size="sm" className={styles.postActionButton}>
                <Image className={styles.icon} />
                Photo
              </Button>
              <Button variant="ghost" size="sm" className={styles.postActionButton}>
                <Video className={styles.icon} />
                Video
              </Button>
              <Button variant="ghost" size="sm" className={styles.postActionButton}>
                <Smile className={styles.icon} />
                Feeling
              </Button>
            </div>
            <Button className={styles.shareButton}>
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Posts Feed */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default ChatPage;
