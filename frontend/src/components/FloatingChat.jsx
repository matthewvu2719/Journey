import { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import RobotMascot from './RobotMascot'
import { useBobo } from '../contexts/BoboContext'

export default function FloatingChat({ habits, logs, onAction }) {
  const [isOpen, setIsOpen] = useState(false)
  const { getEquippedItems } = useBobo()
  const equippedItems = getEquippedItems()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi there! I'm Bobo, your personal habit companion! 🤖 I'm here to help you build amazing habits, celebrate your wins, and keep you on track. What would you like to work on today?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(1) // Start at 1 (initial message)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      // Mark all messages as seen when chat is opened
      setLastSeenMessageCount(messages.length)
      setUnreadCount(0)
    }
  }, [isOpen, messages.length])

  // Track new assistant messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > lastSeenMessageCount) {
      // Count only new assistant messages since last seen
      const newMessages = messages.slice(lastSeenMessageCount)
      const newAssistantMessages = newMessages.filter(msg => msg.role === 'assistant')
      setUnreadCount(newAssistantMessages.length)
    }
  }, [messages, isOpen, lastSeenMessageCount])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // Use advanced agent chat
      const response = await api.agentChat(userMessage, { habits, logs })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content || response.response,
        actions: response.actions,
        suggestions: response.suggestions
      }])
    } catch (error) {
      console.error('Agent chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action) => {
    if (onAction) {
      await onAction(action)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "✅ Action completed! Anything else I can help with?"
      }])
    }
  }

  const quickQuestions = [
    "Create a habit: Run 30 minutes every morning",
    "When should I schedule my workout?",
    "Suggest a new habit for me",
  ]

  return (
    <>
      {/* Chat Window */}
      <div className={`fixed bottom-40 right-6 z-50 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}>
        <div className="w-96 h-[500px] max-h-[calc(100vh-150px)] glass rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-light/20">
          {/* Header */}
          <div className="p-4 border-b border-light/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <RobotMascot size="sm" emotion="excited" animate={true} color={equippedItems.color?.hex || null} />
              </div>
              <div>
                <h3 className="font-bold">Bobo</h3>
                <p className="text-xs text-light/60 font-mono">Your AI Companion</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-light/60 hover:text-light transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Bobo avatar for assistant messages */}
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 mt-1">
                      <RobotMascot 
                        size="sm" 
                        emotion="excited"
                        color={equippedItems.color?.hex || null}
                        hat={equippedItems.hat}
                        costume={equippedItems.costume}
                        animate={false}
                      />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-light text-dark'
                        : 'bg-light/10 text-light'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(suggestion)}
                            className="block w-full text-left text-xs bg-light/20 hover:bg-light/30 text-light px-2 py-1 rounded"
                          >
                            💡 {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {msg.actions && msg.actions.length > 0 && idx === messages.length - 1 && (
                  <div className="mt-2 ml-12 space-y-2">
                    {msg.actions.map((action, i) => (
                      <div key={i} className="bg-light/10 border border-light/20 rounded-lg p-2">
                        <p className="text-xs font-semibold text-light mb-1">
                          Action: {action.type}
                        </p>
                        <button
                          onClick={() => handleAction(action)}
                          className="text-xs px-3 py-1 bg-light text-dark rounded hover:bg-light/90"
                        >
                          Execute
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-light/10 p-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-light/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-light/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-light/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q)}
                  className="px-3 py-1 bg-light/10 text-light/80 rounded-full text-xs hover:bg-light/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-light/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 bg-dark border border-light/20 rounded-full text-light text-sm focus:border-light/60 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-light text-dark rounded-full flex items-center justify-center hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Speech Bubble - shows when there are unread messages */}
      {unreadCount > 0 && !isOpen && (
        <div 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-36 right-6 z-50 cursor-pointer animate-float"
        >
          <div className="relative bg-white/95 backdrop-blur-sm text-gray-800 px-4 py-3 rounded-2xl shadow-xl max-w-[250px]">
            <p className="text-sm font-medium">
              {messages[messages.length - 1]?.role === 'assistant' 
                ? messages[messages.length - 1].content.substring(0, 80) + (messages[messages.length - 1].content.length > 80 ? '...' : '')
                : "I have something to tell you! 💬"}
            </p>
            {/* Speech bubble tail */}
            <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white/95"></div>
            {/* Notification badge on bubble */}
            <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1 shadow-lg">
              <span className="text-white text-xs font-bold">{unreadCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Robot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 transition-all hover:scale-110 focus:outline-none ${
          isOpen ? 'scale-95' : 'scale-100'
        }`}
        style={{ width: '80px', height: '112px' }}
      >
        <RobotMascot 
          size="md" 
          emotion="excited"
          color={equippedItems.color?.hex || null}
          hat={equippedItems.hat}
          costume={equippedItems.costume}
          dance={equippedItems.dance}
          animate={!isOpen} 
        />
      </button>
    </>
  )
}
