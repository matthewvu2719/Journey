import React, { createContext, useContext, useState, useCallback } from 'react';

const BoboContext = createContext();

export const useBobo = () => {
  const context = useContext(BoboContext);
  if (!context) {
    throw new Error('useBobo must be used within a BoboProvider');
  }
  return context;
};

export const BoboProvider = ({ children }) => {
  const [emotion, setEmotion] = useState('happy');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [equippedItems, setEquippedItems] = useState({
    color: null,
    hat: null,
    costume: null,
    dance: null,
  });

  const showMessage = useCallback((msg, emotionType = 'happy') => {
    setMessage(msg);
    setEmotion(emotionType);
    setIsVisible(true);
  }, []);

  const hideBobo = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showBobo = useCallback(() => {
    setIsVisible(true);
  }, []);

  const celebrate = useCallback((msg = 'Great job!') => {
    showMessage(msg, 'excited');
  }, [showMessage]);

  const encourage = useCallback((msg = 'You can do it!') => {
    showMessage(msg, 'happy');
  }, [showMessage]);

  const sympathize = useCallback((msg = "That's okay, try again!") => {
    showMessage(msg, 'sad');
  }, [showMessage]);

  const getEquippedItems = useCallback(() => {
    return equippedItems;
  }, [equippedItems]);

  const equipItem = useCallback((itemType, item) => {
    setEquippedItems(prev => ({
      ...prev,
      [itemType]: item,
    }));
  }, []);

  const unequipItem = useCallback((itemType) => {
    setEquippedItems(prev => ({
      ...prev,
      [itemType]: null,
    }));
  }, []);

  const value = {
    emotion,
    message,
    isVisible,
    equippedItems,
    setEmotion,
    setMessage,
    showMessage,
    hideBobo,
    showBobo,
    celebrate,
    encourage,
    sympathize,
    getEquippedItems,
    equipItem,
    unequipItem,
  };

  return <BoboContext.Provider value={value}>{children}</BoboContext.Provider>;
};
