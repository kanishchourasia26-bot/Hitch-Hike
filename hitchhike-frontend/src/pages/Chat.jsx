import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { ArrowLeft, Send, User } from 'lucide-react';
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
    /* 🔥 FLOATING OVERLAY BACKGROUND 🔥 */
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm">
      
      {/* 🔥 SLIDE-IN CHAT PANEL 🔥 */}
      <motion.div 
        initial={{ x: '100%' }} 
        animate={{ x: 0 }} 
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md h-full bg-gray-50 shadow-2xl flex flex-col"
      >
        
        {/* HEADER */}
        <div className="bg-orange-600 text-white px-4 py-3 flex items-center gap-3 shadow-md z-10 rounded-tl-3xl">
          {/* 🔥 CLOSE BUTTON 🔥 */}
          <button onClick={onClose} className="p-1 hover:bg-orange-500 rounded-full cursor-pointer transition">
            <ArrowLeft size={20} />
          </button>
          
          <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center border border-orange-300">
            <User size={20} />
          </div>
          <div>
            <h2 className="font-bold text-sm">{peerDetails?.name || "Commuter"}</h2>
            <p className="text-[10px] text-orange-100">Online</p>
          </div>
        </div>

        {/* CHAT BOX */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, index) => {
            const isMe = msg.senderId === myId || String(msg.sender) === String(myId) || msg.sender?._id === myId;
            return (
              <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe ? "bg-orange-500 text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"}`}>
                  {msg.text}
                  <p className={`text-[9px] mt-1 text-right ${isMe ? "text-orange-200" : "text-gray-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-200 flex items-center gap-2 pb-6">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 disabled:opacity-50 transition cursor-pointer">
            <Send size={18} className="ml-1" />
          </button>
        </form>

      </motion.div>
    </div>
  );
};

export default Chat;