import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { ArrowLeft, Send, User, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api_service';

const SOCKET_URL = "http://localhost:5000"; 
let socket;

// 🔥 NAYA: Ab yeh useParams() ki jagah seedha props (peerId, onClose) lega
const Chat = ({ peerId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [peerDetails, setPeerDetails] = useState(null);
  
  const userStore = JSON.parse(localStorage.getItem('user')) || {};
  const myId = userStore._id || userStore.id || userStore.user?._id;
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!peerId) return;

    socket = io(SOCKET_URL);
    
    if (myId) {
      socket.emit("join_chat", myId);
    }

    fetchChatHistory();
    fetchPeerDetails();

    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [peerId, myId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const res = await api.get(`/chats/${peerId}`);
      setMessages(res.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchPeerDetails = async () => {
    try {
      const res = await api.get(`/users/${peerId}`);
      setPeerDetails(res.data);
    } catch (error) {
      console.log("Could not fetch peer details");
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      senderId: myId,
      receiverId: peerId,
      text: newMessage
    };

    socket.emit("send_message", msgData);
    setMessages((prev) => [...prev, { ...msgData, createdAt: new Date() }]);
    setNewMessage("");
  };

  return (
    <div className="h-full bg-white flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full cursor-pointer transition">
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
          {peerDetails?.name ? (
            <span className="font-black text-lg">{peerDetails.name[0].toUpperCase()}</span>
          ) : (
            <User size={20} />
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-black text-sm">{peerDetails?.name || "Commuter"}</h2>
          <p className="text-[10px] text-orange-100 flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
            Online
          </p>
        </div>
      </div>

      {/* CHAT BOX */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare size={40} className="mb-2 opacity-30" />
            <p className="text-sm font-semibold">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === myId || String(msg.sender) === String(myId) || msg.sender?._id === myId;
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe 
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-md shadow-md" 
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? "text-orange-200" : "text-gray-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-200 flex items-center gap-2 shadow-inner">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..." 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
        />
        <motion.button 
          whileTap={{ scale: 0.9 }}
          type="submit" 
          disabled={!newMessage.trim()} 
          className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer"
        >
          <Send size={16} className="ml-0.5" strokeWidth={2.5} />
        </motion.button>
      </form>

    </div>
  );
};

export default Chat;