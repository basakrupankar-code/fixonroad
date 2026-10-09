import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hi! I am the FixOnRoad AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);

    // Fake AI Response logic handling trilingual
    setTimeout(() => {
      const lower = input.toLowerCase();
      let response = '';
      
      if (lower.includes('tire') || lower.includes('puncture') || lower.includes('ফ্ল্যাট টায়ার')) {
        response = 'It sounds like you have a flat tire. I can help you book a mechanic instantly. Click the button below to request help.';
      } else if (lower.includes('battery') || lower.includes('start') || lower.includes('ব্যাটারি')) {
        response = 'Having battery issues? Our mechanics can jump-start your vehicle. Should I redirect you to the booking page?';
      } else if (lower.includes('namaskar') || lower.includes('hi') || lower.includes('হ্যালো')) {
        response = 'Namaskar! / Hello! / নমস্কার! How can I assist you on the road today?';
      } else {
        response = "I'm here to help with any roadside emergencies. Could you describe the issue with your vehicle (e.g., flat tire, dead battery, engine won't start)?";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleBookNow = () => {
    setIsOpen(false);
    navigate('/services');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl transition-transform hover:scale-110 z-40 flex items-center justify-center group"
      >
        <MessageSquare className="w-6 h-6" />
        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-[#121824] text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 whitespace-nowrap">
          Ask AI Assistant
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-full max-w-sm sm:w-96 bg-[#121824] border border-slate-800 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="bg-[#0B0F17] p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/50">
                  <Bot className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Roadside Assistant</h3>
                  <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-orange-500/20 text-orange-400'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[75%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-gray-200 rounded-tl-none'}`}>
                    {msg.content}
                    {msg.role === 'assistant' && msg.content.includes('mechanic instantly') && (
                      <button onClick={handleBookNow} className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold w-full hover:bg-orange-600 transition-colors">
                        Book Mechanic Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800 text-gray-400 rounded-tl-none text-xs flex items-center gap-1">
                    Typing<span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800 bg-[#0B0F17]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type 'flat tire' or 'ব্যাটারি'..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
