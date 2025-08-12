import React, { useState, useEffect, useRef } from 'react';

export default function GroupChat({ groupId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await fetch(`http://localhost:8080/api/groups/messages?group_id=${groupId}&limit=50`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Not authenticated. Please login again.');
          }
          if (res.status === 403) {
            throw new Error('Not authorized to access this group.');
          }
          throw new Error(`Failed to fetch messages (${res.status})`);
        }

        const data = await res.json().catch(() => {
          throw new Error('Invalid response from server');
        });
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }

        setMessages(data.reverse());
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        setError(err.message || 'Failed to load messages');
        console.error('Error fetching messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const connectWebSocket = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Create WebSocket with Authorization header
        ws.current = new WebSocket(`ws://localhost:8080/ws/group?group_id=${groupId}`);
        ws.current.addEventListener('open', () => {
          // Send authorization after connection
          ws.current.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        });

        ws.current.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        ws.current.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (!msg.text && !msg.Text) {
              console.warn('Received message without text:', msg);
              return;
            }
            setMessages(prev => [...prev, msg]);
            setTimeout(scrollToBottom, 100);
          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        };

        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        ws.current.onclose = (event) => {
          setIsConnected(false);
          
          if (reconnectAttempts < maxReconnectAttempts) {
            // Exponential backoff: 3s, 6s, 12s, 24s, 48s
            const delay = 3000 * Math.pow(2, reconnectAttempts);
            setError(`Connection lost. Reconnecting in ${delay/1000} seconds...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts++;
              connectWebSocket();
            }, delay);
          } else {
            setError('Connection lost. Please refresh the page to reconnect.');
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error. Attempting to reconnect...');
          ws.current?.close();
        };
      } catch (err) {
        setError('Failed to connect');
        console.error('WebSocket connection error:', err);
      }
    };

    fetchMessages();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [groupId]);

  const sendMessage = () => {
    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg = { group_id: groupId, text: input.trim() };
      try {
        ws.current.send(JSON.stringify(msg));
        setInput('');
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
      }
    }
  };

  return (
    <div style={{ padding: 16, background: 'var(--background-secondary)', borderRadius: 8 }}>
      <h4>Group Chat {!isConnected && <span style={{ color: '#ff4444', fontSize: '0.8em' }}>(Disconnected)</span>}</h4>
      {error && (
        <div style={{ color: '#ff4444', marginBottom: 8, padding: 8, background: 'rgba(255,0,0,0.1)', borderRadius: 4 }}>
          {error}
        </div>
      )}
      <div style={{ minHeight: 120, maxHeight: 300, overflowY: 'auto', background: '#222', color: '#fff', padding: 8, borderRadius: 4, marginBottom: 8 }}>
        {isLoading ? (
          <div style={{ color: '#bbb' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ color: '#bbb' }}>No messages yet.</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 'bold' }}>{msg.sender || msg.Sender}:</span>{' '}
              {msg.text || msg.Text}{' '}
              <span style={{ fontSize: 10, color: '#aaa' }}>{msg.time || msg.CreatedAt || ''}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          style={{ 
            flex: 1, 
            padding: 8, 
            borderRadius: 4, 
            border: '1px solid #444', 
            background: '#111', 
            color: '#fff',
            opacity: isConnected ? 1 : 0.7
          }}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          disabled={!isConnected}
        />
        <button 
          onClick={sendMessage} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: 4, 
            background: isConnected ? 'var(--accent-color)' : '#666', 
            color: '#fff', 
            border: 'none',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            opacity: isConnected ? 1 : 0.7
          }}
          disabled={!isConnected}
        >
          Send
        </button>
      </div>
    </div>
  );
}
