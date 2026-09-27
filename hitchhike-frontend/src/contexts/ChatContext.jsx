import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [activeChatPeerId, setActiveChatPeerId] = useState(null);

  const openChat = (peerId) => {
    setActiveChatPeerId(peerId);
  };

  const closeChat = () => {
    setActiveChatPeerId(null);
  };

  return (
    <ChatContext.Provider value={{ activeChatPeerId, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
};
