import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  ArrowLeft, Send, User, MessageSquare, Check, CheckCheck, 
  Smile, Paperclip, MoreVertical, Search, Phone, Video,
  Clock, Loader2, AlertCircle, Wifi, WifiOff, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api_service';

const SOCKET_URL = "http://localhost:5000"; 
let socket;

const Chat = ({ peerId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [peerDetails, setPeerDetails] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const userStore = JSON.parse(localStorage.getItem('user')) || {};
  const myId = userStore._id || userStore.id || userStore.user?._id;
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Common emojis for quick access
  const quickEmojis = ['👍', '❤️', '😊', '😂', '😢', '🙏', '👏', '🎉', '🔥', '✨', '💯', '🚀'];

  useEffect(() => {
    if (!peerId) return;

    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected');
      setConnectionStatus('connected');
      if (myId) {
        socket.emit("join_chat", myId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setConnectionStatus('error');
      setError('Connection failed. Retrying...');
    });

    // Chat event handlers
    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, { ...message, status: 'delivered' }]);
      
      // Play notification sound
      playNotificationSound();
      
      // Send read receipt if chat is open
      socket.emit("message_read", { messageId: message._id, senderId: message.senderId });
    });

    socket.on("typing", ({ userId }) => {
      if (userId === peerId) {
        setIsTyping(true);
      }
    });

    socket.on("stop_typing", ({ userId }) => {
      if (userId === peerId) {
        setIsTyping(false);
      }
    });

    socket.on("user_online", ({ userId }) => {
      if (userId === peerId) {
        setIsOnline(true);
      }
    });

    socket.on("user_offline", ({ userId }) => {
      if (userId === peerId) {
        setIsOnline(false);
      }
    });

    socket.on("message_delivered", ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg.tempId === messageId || msg._id === messageId 
          ? { ...msg, status: 'delivered' } 
          : msg
      ));
    });

    socket.on("message_read", ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, status: 'read' } 
          : msg
      ));
    });

    fetchChatHistory();
    fetchPeerDetails();

    return () => {
      socket.disconnect();
    };
  }, [peerId, myId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const playNotificationSound = () => {
    // Simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.log('Audio notification not supported');
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await api.get(`/chats/${peerId}`);
      const messagesWithStatus = res.data.map(msg => ({
        ...msg,
        status: msg.senderId === myId ? 'read' : 'delivered'
      }));
      setMessages(messagesWithStatus);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError('Failed to load messages');
    }
  };

  const fetchPeerDetails = async () => {
    try {
      const res = await api.get(`/users/${peerId}`);
      console.log('Peer details response:', res.data); // Debug log
      
      // Backend returns { success: true, user: {...} }
      const userData = res.data.user || res.data;
      setPeerDetails(userData);
    } catch (error) {
      console.error("Could not fetch peer details:", error);
    }
  };

  const handleTyping = () => {
    socket.emit("typing", { userId: myId, peerId });
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { userId: myId, peerId });
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    setError(null);
    
    const tempId = Date.now().toString();
    const msgData = {
      tempId,
      senderId: myId,
      receiverId: peerId,
      text: newMessage.trim(),
      createdAt: new Date(),
      status: 'sending'
    };

    // Optimistic update
    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");
    
    // Stop typing indicator
    socket.emit("stop_typing", { userId: myId, peerId });

    try {
      // Emit to socket
      socket.emit("send_message", msgData);
      
      // Update status to sent
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, status: 'sent' } 
          : msg
      ));
      
      setSendingMessage(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
      
      // Mark as failed
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, status: 'failed' } 
          : msg
      ));
      
      setSendingMessage(false);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ', ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <Clock size={12} className="text-gray-400" />;
      case 'sent':
        return <Check size={12} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={12} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={12} className="text-blue-500" />;
      case 'failed':
        return <AlertCircle size={12} className="text-red-500" />;
      default:
        return null;
    }
  };

  const ConnectionIndicator = () => {
    if (connectionStatus === 'connected') return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-xs py-1 px-4 text-center flex items-center justify-center gap-2"
      >
        {connectionStatus === 'connecting' && (
          <>
            <Loader2 size={12} className="animate-spin" />
            Connecting...
          </>
        )}
        {connectionStatus === 'disconnected' && (
          <>
            <WifiOff size={12} />
            Disconnected. Trying to reconnect...
          </>
        )}
        {connectionStatus === 'error' && (
          <>
            <AlertCircle size={12} />
            Connection error. Retrying...
          </>
        )}
      </motion.div>
    );
  };

  const ProfileModal = () => {
    if (!showProfileModal) return null;

    // Show loading if peerDetails not yet loaded
    if (!peerDetails) {
      return (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProfileModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center">
              <Loader2 size={40} className="animate-spin text-orange-500 mb-4" />
              <p className="text-gray-600 font-semibold">Loading profile...</p>
            </div>
          </motion.div>
        </>
      );
    }

    return (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowProfileModal(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-orange-500 to-rose-500 p-6 text-center relative">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-3 right-3 text-white/80 hover:text-white p-2 hover:bg-white/20 rounded-full transition"
              >
                <X size={18} />
              </button>
              
              {/* Avatar */}
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/30 shadow-xl">
                <span className="text-4xl font-black text-white">
                  {peerDetails.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              
              <h2 className="text-xl font-black text-white mb-1">
                {peerDetails.name || 'Unknown User'}
              </h2>
              
              <div className="flex items-center justify-center gap-2 text-white/90 text-xs">
                {isOnline ? (
                  <>
                    <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Online</span>
                  </>
                ) : (
                  <span>Offline</span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              {/* Email */}
              {peerDetails.email && (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 text-base">📧</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Email</p>
                    <p className="text-xs font-bold text-gray-800 truncate">{peerDetails.email}</p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {peerDetails.phone && (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Phone</p>
                    <p className="text-xs font-bold text-gray-800">{peerDetails.phone}</p>
                  </div>
                </div>
              )}

              {/* Gender & Age Combined */}
              <div className="flex gap-2">
                {peerDetails.gender && (
                  <div className="flex-1 flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-600 text-base">
                        {peerDetails.gender === 'male' ? '👨' : peerDetails.gender === 'female' ? '👩' : '🧑'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Gender</p>
                      <p className="text-xs font-bold text-gray-800 capitalize">{peerDetails.gender}</p>
                    </div>
                  </div>
                )}

                {peerDetails.age && (
                  <div className="flex-1 flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-base">🎂</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Age</p>
                      <p className="text-xs font-bold text-gray-800">{peerDetails.age} yrs</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle Number */}
              {peerDetails.vehicleNumber && (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 text-base">🚗</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Vehicle</p>
                    <p className="text-xs font-bold text-gray-800 uppercase">{peerDetails.vehicleNumber}</p>
                  </div>
                </div>
              )}

              {/* Verification Badges */}
              {(peerDetails.isAadhaarVerified || peerDetails.isDlVerified) && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {peerDetails.isAadhaarVerified && (
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                      <span>✓</span> Aadhaar
                    </div>
                  )}
                  {peerDetails.isDlVerified && (
                    <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                      <span>✓</span> DL
                    </div>
                  )}
                </div>
              )}

              {/* Member Since */}
              {peerDetails.createdAt && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 text-center">
                    Member since {new Date(peerDetails.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* Close Button at Bottom */}
            <div className="p-4 pt-0">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  };

  return (
    <div className="h-full bg-white flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-gray-200 relative">
      
      <ConnectionIndicator />
      
      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && <ProfileModal />}
      </AnimatePresence>
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="p-2 hover:bg-white/20 rounded-full cursor-pointer transition"
          title="Close Chat"
        >
          <X size={20} strokeWidth={2.5} />
        </motion.button>
        
        <button
          onClick={() => setShowProfileModal(true)}
          className="relative w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition cursor-pointer"
          title="View Profile"
        >
          {peerDetails?.name ? (
            <span className="font-black text-lg">{peerDetails.name[0].toUpperCase()}</span>
          ) : (
            <User size={20} />
          )}
          {/* Online Indicator */}
          {isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
          )}
        </button>
        
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex-1 text-left hover:opacity-80 transition cursor-pointer"
          title="View Profile"
        >
          <h2 className="font-black text-sm">{peerDetails?.name || "User"}</h2>
          <AnimatePresence mode="wait">
            {isTyping ? (
              <motion.p 
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-orange-100 flex items-center gap-1"
              >
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                typing...
              </motion.p>
            ) : (
              <motion.p 
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-orange-100 flex items-center gap-1"
              >
                {isOnline ? (
                  <>
                    <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </>
                ) : (
                  'Offline'
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/20 rounded-full cursor-pointer transition"
            title="Voice Call"
          >
            <Phone size={16} />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/20 rounded-full cursor-pointer transition"
            title="Video Call"
          >
            <Video size={16} />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/20 rounded-full cursor-pointer transition"
            title="More Options"
          >
            <MoreVertical size={16} />
          </motion.button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-red-700 text-xs"
          >
            <AlertCircle size={14} />
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT BOX */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-bold">No messages yet</p>
            <p className="text-xs mt-1 text-gray-400">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === myId || String(msg.sender) === String(myId) || msg.sender?._id === myId;
            const showDate = index === 0 || 
              new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
            
            return (
              <React.Fragment key={msg._id || msg.tempId || index}>
                {/* Date Separator */}
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full">
                      {new Date(msg.createdAt).toDateString() === new Date().toDateString() 
                        ? 'Today' 
                        : new Date(msg.createdAt).toLocaleDateString([], { 
                            month: 'short', 
                            day: 'numeric', 
                            year: new Date(msg.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
                          })
                      }
                    </div>
                  </div>
                )}
                
                {/* Message Bubble */}
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe 
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-md" 
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                    }`}>
                      <p className="leading-relaxed break-words">{msg.text}</p>
                    </div>
                    
                    {/* Time & Status */}
                    <div className={`flex items-center gap-1 px-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[9px] text-gray-400">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      {isMe && getStatusIcon(msg.status)}
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })
        )}
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start"
            >
              <div className="bg-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* EMOJI PICKER */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-4 right-4 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-10"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-700">Quick Emojis</p>
              <button 
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {quickEmojis.map((emoji, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT AREA */}
      <form 
        onSubmit={handleSendMessage} 
        className="bg-white p-3 border-t border-gray-200 flex items-center gap-2 shadow-inner"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          title="Add Emoji"
        >
          <Smile size={20} className="text-gray-500" />
        </motion.button>

        <input 
          ref={inputRef}
          type="text" 
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..." 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
          disabled={sendingMessage || connectionStatus !== 'connected'}
        />

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          title="Attach File"
        >
          <Paperclip size={20} className="text-gray-500" />
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          type="submit" 
          disabled={!newMessage.trim() || sendingMessage || connectionStatus !== 'connected'}
          className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
        >
          {sendingMessage ? (
            <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
          ) : (
            <Send size={16} className="ml-0.5" strokeWidth={2.5} />
          )}
        </motion.button>
      </form>

    </div>
  );
};

export default Chat;
