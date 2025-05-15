'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { StreamChat, MessageResponse, Channel } from 'stream-chat';

interface ProfilePictureData {
  id: number;
  name: string;
  imageUrl: string;
  category: string | null;
}

interface UserWithProfile {
  id: string;
  username: string;
  email: string;
  profilePicture: ProfilePictureData;
}

interface MessageGroup {
  date: string;
  messages: MessageResponse[];
}

const DEFAULT_AVATAR = {
  id: 0,
  name: 'Default Avatar',
  imageUrl: '/images/avatars/defaultAvatar.png',
  category: 'default'
};

export default function Messages() {
  const { data: session } = useSession();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<string, UserWithProfile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [householdUsers, setHouseholdUsers] = useState<UserWithProfile[]>([]);
  const [householdName, setHouseholdName] = useState<string>('Household Chat');
  
  const scrollToBottom = () => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const fetchHouseholdData = async () => {
      if (!session?.user?.householdId) return;
      
      try {
        setLoading(true);
        const householdResponse = await fetch(`/api/household?householdId=${session.user.householdId}`);
        if (householdResponse.ok) {
          const householdData = await householdResponse.json();
          if (householdData.name) {
            setHouseholdName(householdData.name);
          }
        }

        const usersResponse = await fetch(`/api/household/users/profiles?householdId=${session.user.householdId}`);
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          
          const userMap: Record<string, UserWithProfile> = {};
          users.forEach((user: UserWithProfile) => {
            if (!user.profilePicture) {
              user.profilePicture = DEFAULT_AVATAR;
            }
            userMap[user.id] = user;
          });
          
          setHouseholdUsers(users);
          setUsersMap(userMap);
          setUserDataLoaded(true);
        }
      } catch (err) {
        console.error('Error fetching household data:', err);
      }
    };
    
    fetchHouseholdData();
  }, [session]);

  useEffect(() => {
    let streamClient: StreamChat | null = null;
    
    const initStreamChat = async () => {
      if (!session?.user?.id || !session.user?.householdId || !userDataLoaded) return;
      
      try {
        if (client) {
          await client.disconnectUser();
          setClient(null);
        }
        
        const tokenResponse = await fetch('/api/messages/token');
        if (!tokenResponse.ok) {
          throw new Error('Failed to get authentication token');
        }
        
        const { token, userId } = await tokenResponse.json();
        
        streamClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY || '');
        
        await streamClient.connectUser(
          {
            id: userId,
            name: session.user.username || 'User',
            image: getUserProfilePicture(userId),
          },
          token
        );
        
        setClient(streamClient);
        
        const householdId = session.user.householdId;
        const channelId = `household-${householdId}`;
        
        const householdChannel = streamClient.channel('messaging', channelId, {
          members: [userId],
          created_by_id: userId,
        });
        

        await householdChannel.watch();
        
        const channelResponse = await householdChannel.query({ messages: { limit: 100 } });
        if (channelResponse.messages) {
          setMessages(channelResponse.messages);
        }
        
        householdChannel.on('message.new', (event) => {
          if (event.message) {
            setMessages((prevMessages) => [...prevMessages, event.message as MessageResponse]);
            setTimeout(scrollToBottom, 100);
          }
        });
        
        setLoading(false);
        setTimeout(scrollToBottom, 300);
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to initialize chat. Please try again.');
        setLoading(false);
      }
    };
    
    if (userDataLoaded) {
      initStreamChat();
    }
    
    return () => {
      const disconnect = async () => {
        if (client) {
          await client.disconnectUser();
        } else if (streamClient) {
          await streamClient.disconnectUser();
        }
      };
      
      disconnect().catch(error => {
        console.error('Error disconnecting user:', error);
      });
    };
  }, [session, userDataLoaded]);
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !client || !session?.user?.id) return;
    
    try {
      const householdId = session.user.householdId;
      const channelId = `household-${householdId}`;
      const channel = client.channel('messaging', channelId);
      
      await channel.sendMessage({
        text: inputMessage,
        user_id: session.user.id,
      });
      
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const formatTime = (timestamp: string | Date | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp: string | Date | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  const getUserProfilePicture = (userId: string): string => {
    if (usersMap[userId]?.profilePicture?.imageUrl) {
      return usersMap[userId].profilePicture.imageUrl;
    }
    
    return DEFAULT_AVATAR.imageUrl;
  };
  
  const getUserName = (userId: string): string => {
    if (usersMap[userId]?.username) {
      return usersMap[userId].username;
    }
    
    return 'User';
  };
  
  const groupedMessages = (): MessageGroup[] => {
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;
    
    messages.forEach(message => {
      if (!message.created_at) return;
      
      const date = new Date(message.created_at).toLocaleDateString();
      
      if (!currentGroup || currentGroup.date !== date) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { date, messages: [] };
      }
      
      currentGroup.messages.push(message);
    });
    
    if (currentGroup) groups.push(currentGroup);
    return groups;
  };

  if (!session?.user?.householdId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-zinc-50">
        <h2 className="text-2xl font-bold mb-4">No Household</h2>
        <p className="text-center mb-6">
          You need to be part of a household to use the messaging feature.
        </p>
        <a
          href="/household"
          className="bg-zinc-800 text-zinc-50 px-4 py-2 rounded-md hover:bg-zinc-700 text-sm font-normal"
        >
          Join or Create a Household
        </a>
      </div>
    );
  }

  if (loading || !userDataLoaded) {
    return (
      <div className="flex justify-center items-center h-full bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-50 mb-4"></div>
          <p className="text-zinc-50">Loading user profiles...</p>
        </div>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="flex h-full bg-zinc-950 text-zinc-50">
        <div className="w-72 border-r border-zinc-800 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-medium text-zinc-50 mb-4">Messages</h2>
            <div className="space-y-2">
              {householdUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center p-2 rounded hover:bg-zinc-800 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-zinc-800">
                    <Image 
                      src={user.profilePicture?.imageUrl || DEFAULT_AVATAR.imageUrl}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-zinc-50 font-medium">{user.username}</div>
                    <div className="text-zinc-400 text-sm truncate">
                      {user.id === session?.user?.id ? 'You' : 'Household member'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div ref={messagesContainerRef} className="flex-1 flex items-center justify-center p-4 bg-zinc-950">
            <p className="text-zinc-400">No messages yet. Start a conversation!</p>
          </div>
          
          <div className="p-3 border-t border-zinc-800 bg-zinc-950">
            <form onSubmit={sendMessage} className="flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Write your first message..."
                className="flex-1 bg-zinc-800 border-0 rounded-full px-4 py-2 text-zinc-50 focus:outline-none"
              />
              
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="ml-2 w-8 h-8 flex items-center justify-center text-zinc-400 disabled:text-zinc-600 rounded hover:bg-zinc-800"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-50">
      <div className="w-72 border-r border-zinc-800 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-medium text-zinc-50 mb-4">Members</h2>
          <div className="space-y-2">
            {householdUsers.map((user) => (
              <div 
                key={user.id}
                className="flex items-center p-2 rounded hover:bg-zinc-800 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-zinc-800">
                  <Image 
                    src={user.profilePicture?.imageUrl || DEFAULT_AVATAR.imageUrl}
                    alt={user.username}
                    width={40}
                    height={40}
                    className="object-cover"
                    priority={true}
                  />
                </div>
                <div>
                  <div className="text-zinc-50 font-medium">{user.username}</div>
                  <div className="text-zinc-400 text-sm truncate">
                    {user.id === session?.user?.id ? 'You' : 'Household member'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-zinc-950">
          <div className="w-full max-w-4xl mx-auto">
            {messages.map((message, index) => {
              const isCurrentUser = message.user?.id === session?.user?.id;
              const userName = message.user?.id ? getUserName(message.user.id) : 'User';
              const profilePicture = message.user?.id ? getUserProfilePicture(message.user.id) : DEFAULT_AVATAR.imageUrl;
              
              if (isCurrentUser) {
                return (
                  <div key={message.id} className="mb-4 flex justify-end">
                    <div className="flex items-start">
                      <div className="text-right mr-2">
                        <div className="flex items-center justify-end mb-1">
                          <span className="text-xs text-zinc-400 mr-2">
                            {formatTime(message.created_at)}
                          </span>
                          <span className="text-sm text-zinc-400">You</span>
                        </div>
                        <div className="bg-blue-600 text-zinc-50 px-4 py-2 rounded-2xl inline-block max-w-[300px]">
                          <p className="text-sm break-words">{message.text}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                        <Image 
                          src={profilePicture}
                          alt="Your avatar"
                          width={32}
                          height={32}
                          className="object-cover"
                          priority={true}
                        />
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={message.id} className="mb-4 flex justify-start">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mr-2 bg-zinc-800">
                        <Image 
                          src={profilePicture}
                          alt={userName}
                          width={32}
                          height={32}
                          className="object-cover"
                          priority={true}
                        />
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm text-zinc-50 mr-2">
                            {userName}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <div className="bg-zinc-800 text-zinc-50 px-4 py-2 rounded-2xl inline-block max-w-[300px]">
                          <p className="text-sm break-words">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="p-3 border-t border-zinc-800 bg-zinc-950">
          <form onSubmit={sendMessage} className="flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Aa..."
              className="flex-1 bg-zinc-800 border-0 rounded-full px-4 py-2 text-zinc-50 focus:outline-none"
            />
            
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="ml-2 w-8 h-8 flex items-center justify-center text-zinc-400 disabled:text-zinc-600 rounded hover:bg-zinc-800"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}