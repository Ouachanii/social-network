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
          localStorage.removeItem('token'); // Clean up invalid token
          window.location.href = '/login'; // Redirect to login
          throw new Error('No authentication token found');
        }
        
        // Check if token is expired (if it's a JWT)
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              localStorage.removeItem('token');
              window.location.href = '/login';
              throw new Error('Authentication expired. Please login again.');
            }
          }
        } catch (e) {
          console.error('Error checking token:', e);
        }

        // Prepare auth header with Bearer token
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

        const res = await fetch(`http://localhost:8080/api/groups/messages?group_id=${groupId}&limit=50`, {
          headers: {
            'Authorization': authToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        console.log("-------------")
        console.log(res)
        console.log("-------------")
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
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('No authentication token found');
        }

        // Create WebSocket connection
        ws.current = new WebSocket(`ws://localhost:8080/ws/group?group_id=${groupId}`);
        
        let authSent = false;
        let authTimeout;
        
        ws.current.onopen = () => {
          console.log('WebSocket connection opened');
          
          // Set timeout for authentication
          authTimeout = setTimeout(() => {
            if (!isConnected) {
              console.error('Authentication timeout');
              ws.current?.close();
            }
          }, 5000);
          
          // Ensure token has Bearer prefix
          const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          
          // Send authentication message
          try {
            ws.current.send(JSON.stringify({
              type: 'auth',
              token: authToken
            }));
            authSent = true;
          } catch (err) {
            console.error('Failed to send auth message:', err);
            clearTimeout(authTimeout);
            ws.current?.close();
          }
        };

        ws.current.onmessage = (event) => {
          try {
            // Handle authentication success message
            if (event.data === "authenticated") {
              console.log('WebSocket authenticated');
              clearTimeout(authTimeout);
              setIsConnected(true);
              setError(null);
              return;
            }

            // Parse and handle regular messages
            let msg;
            try {
              msg = JSON.parse(event.data);
            } catch (err) {
              console.error('Invalid message format:', event.data);
              return;
            }

            // Handle error messages
            if (msg.error) {
              setError(msg.error);
              if (msg.error.includes('auth') || msg.error.includes('token')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }
              return;
            }

            // Handle regular chat messages
            if (!msg.text && !msg.Text) {
              console.warn('Received message without text:', msg);
              return;
            }

            // Add message to state
            setMessages(prev => {
              // Check for duplicates
              const isDuplicate = prev.some(m => 
                m.text === msg.text && 
                m.sender === msg.sender && 
                m.time === msg.time
              );
              if (isDuplicate) return prev;
              return [...prev, msg];
            });

            setTimeout(scrollToBottom, 100);
          } catch (err) {
            console.error('Failed to handle message:', err);
          }
        };
        
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        ws.current.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          setIsConnected(false);
          clearTimeout(authTimeout);

          // Don't reconnect if it was a normal closure or authentication issue
          if (event.code === 1000 || event.code === 1001 || event.reason.includes('auth')) {
            if (event.reason.includes('auth')) {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
            return;
          }

          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            setError(`Connection lost. Reconnecting in ${delay/1000} seconds...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts++;
              connectWebSocket();
            }, delay);
          } else {
            setError('Connection lost. Please refresh the page.');
          }
        };

        ws.current.onerror = (event) => {
          console.error('WebSocket error:', {
            type: event.type,
            readyState: ws.current?.readyState,
            url: ws.current?.url
          });
          
          if (!authSent) {
            setError('Failed to establish connection');
          } else if (!isConnected) {
            setError('Authentication failed');
          } else {
            setError('Connection error');
          }
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
