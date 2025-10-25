import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  extractedInfo?: any;
  matchedPets?: any[];
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  sessionId: string;
}

export function useSARBuddyChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    conversationId: null,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user?.id || null,
          session_id: state.sessionId,
          metadata: {
            source: 'sar_buddy_chat',
            started_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (!error && conversation) {
        setState(prev => ({ ...prev, conversationId: conversation.id }));
        
        // Load existing messages if any
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (messages) {
          setState(prev => ({
            ...prev,
            messages: messages.map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at),
              extractedInfo: m.extracted_info,
              matchedPets: m.matched_pets
            }))
          }));
        }
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    try {
      // Call the edge function with session tracking
      const { data, error } = await supabase.functions.invoke('sar-buddy-chat', {
        body: {
          message: content,
          conversationId: state.conversationId,
          sessionId: state.sessionId
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_ai_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: data?.response || generateFallbackResponse(state.messages.length),
        timestamp: new Date(),
        extractedInfo: data?.extractedInfo,
        matchedPets: data?.matchedPets
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        conversationId: data?.conversationId || prev.conversationId
      }));

      // Trigger event for matched pets
      if (data?.matchedPets && data.matchedPets.length > 0) {
        window.dispatchEvent(new CustomEvent('sar-buddy-matches', {
          detail: { pets: data.matchedPets }
        }));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: generateFallbackResponse(state.messages.length),
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false
      }));
    }
  }, [state.conversationId, state.sessionId, state.messages.length]);
  // Helper function to generate varied fallback responses
  const generateFallbackResponse = (messageCount: number) => {
    const responses = [
      "I'm here to help reunite lost pets! What does the pet look like?",
      "Let's find this pet together. Can you describe their appearance?",
      "I'll help you search. What breed and color is the pet?",
      "Ready to assist! Where and when was the pet last seen?",
      "Let's get started. Any distinctive features or markings?",
      "I'm on it! Is this a lost or found pet report?",
      "Happy to help! What size is the pet - small, medium, or large?",
      "Let's locate them. Was the pet wearing a collar or tags?",
      "I'll do my best to help. How long has the pet been missing?",
      "Let's work together. Can you share any photos or detailed description?",
      "What's the pet's name? Sometimes they respond to being called.",
      "Have you posted on local social media groups yet?",
      "Did the pet have any favorite places they liked to visit?",
      "Was your pet microchipped? That could really help.",
      "Any medical conditions or special needs I should know about?",
      "What time of day did they disappear? That might give us clues.",
      "Have you contacted local shelters and vets in the area?",
      "Did anything unusual happen before they went missing?"
    ];
    
    // Use random selection instead of modulo to avoid predictable loops
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  };

  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      conversationId: null
    }));
    initializeConversation();
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    sendMessage,
    clearChat,
    conversationId: state.conversationId
  };
}