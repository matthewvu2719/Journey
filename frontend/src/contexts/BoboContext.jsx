import { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
  const [loading, setLoading] = useState(true);

  // Load equipped items from backend on mount
  useEffect(() => {
    const loadEquippedItems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8000/api/bobo/customizations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Fetch full item details for each equipped item
          const itemsResponse = await fetch('http://localhost:8000/api/bobo/items', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (itemsResponse.ok) {
            const allItems = await itemsResponse.json();
            
            // Map equipped IDs to full item objects
            const equipped = {
              hat: allItems.find(i => i.item_id === data.hat) || null,
              costume: allItems.find(i => i.item_id === data.costume) || null,
              color: allItems.find(i => i.item_id === data.color) || null,
              dance: allItems.find(i => i.item_id === data.dance) || null,
            };
            
            setEquippedItems(equipped);
          }
        }
      } catch (error) {
        console.error('Error loading equipped items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEquippedItems();
  }, []);

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
    loading,
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
