import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, User, ChevronRight } from 'lucide-react';
import api from '../services/api_service';
import Chat from '../pages/Chat';

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatPeerId, setActiveChatPeerId] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch recent chats when bubble opens
  useEffect(() => {
    if (isOpen && !activeChatPeerId) {
      fetchRecentChats();
    }
  }, [isOpen, activeChatPeerId]);

  const fetchRecentChats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/chats');
      const chats = response.data || [];
      setRecentChats(chats);
      
      // Calculate total unread
      const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (peerId) => {
    setActiveChatPeerId(peerId);
  };

  const handleCloseChatList = () => {
    setIsOpen(false);
  };

  const handleCloseActiveChat = () => {
    setActiveChatPeerId(null);
    fetchRecentChats(); // Refresh chat list
  };

  return (
    <>
      {/* FLOATING CHAT BUTTON */}
      {!isOpen && !activeChatPeerId && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-2xl shadow-orange-500/40 flex items-center justify-center text-white cursor-pointer group"
        >
          <MessageCircle size={28} strokeWidth={2} className="group-hover:rotate-12 transition-transform" />
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-7 w-7 bg-red-500 rounded-full flex items-center justify-center text-xs font-black text-white border-2 border-white shadow-lg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </motion.button>
      )}

      {/* CHAT LIST POPUP (Messenger Style) */}
      <AnimatePresence>
        {isOpen && !activeChatPeerId && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Messages</h3>
                <p className="text-xs text-orange-100">
                  {recentChats.length} conversation{recentChats.length !== 1 ? 's' : ''}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseChatList}
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* CHAT LIST */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                </div>
              ) : recentChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <MessageCircle size={40} className="mb-3 opacity-30" />
                  <p className="text-sm font-semibold">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start chatting with commuters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentChats.map((chat, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ backgroundColor: '#fff7ed' }}
                      onClick={() => handleChatClick(chat.peerId)}
                      className="flex items-center gap-3 p-4 cursor-pointer transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-black text-lg">
                          {chat.name ? chat.name[0].toUpperCase() : <User size={20} />}
                        </div>
                        {chat.unread > 0 && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white">
                            {chat.unread}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm text-gray-900 truncate">
                            {chat.name || 'Unknown User'}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {chat.time ? new Date(chat.time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : ''}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${
                          chat.unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'
                        }`}>
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                      </div>

                      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE CHAT WINDOW */}
      <AnimatePresence>
        {activeChatPeerId && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] rounded-3xl shadow-2xl overflow-hidden"
          >
            <Chat peerId={activeChatPeerId} onClose={handleCloseActiveChat} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatButton;
