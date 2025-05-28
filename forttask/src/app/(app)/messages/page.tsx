'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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

const DEFAULT_AVATAR = {
    id: 0,
    name: 'Default Avatar',
    imageUrl: '/images/avatars/defaultAvatar.png',
    category: 'default',
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
    const [householdUsers, setHouseholdUsers] = useState<UserWithProfile[]>([]);
    const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [messageLimit] = useState(30);
    const [channelInstance, setChannelInstance] = useState<Channel | null>(null);
    const [isTabVisible, setIsTabVisible] = useState(true);
    const clientRef = useRef<StreamChat | null>(null);
    const channelRef = useRef<Channel | null>(null);
    const reconnectingRef = useRef(false);

    const getUserProfilePicture = useCallback(
        (userId: string): string => {
            if (usersMap[userId]?.profilePicture?.imageUrl) {
                return usersMap[userId].profilePicture.imageUrl;
            }

            return DEFAULT_AVATAR.imageUrl;
        },
        [usersMap],
    );

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
                    await householdResponse.json();
                }

                const usersResponse = await fetch(
                    `/api/household/users/profiles?householdId=${session.user.householdId}`,
                );
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
        let isComponentMounted = true;

        const initStreamChat = async () => {
            if (!session?.user?.id || !session.user?.householdId || !userDataLoaded) return;

            try {
                if (reconnectingRef.current) return;

                let streamClient = clientRef.current;

                if (!streamClient) {
                    const tokenResponse = await fetch('/api/messages/token');
                    if (!tokenResponse.ok) {
                        throw new Error('Failed to get authentication token');
                    }

                    const { token, userId } = await tokenResponse.json();

                    streamClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY || '');
                    clientRef.current = streamClient;

                    await streamClient.connectUser(
                        {
                            id: userId,
                            name: session.user.username || 'User',
                            image: getUserProfilePicture(userId),
                        },
                        token,
                    );

                    if (isComponentMounted) {
                        setClient(streamClient);
                    }
                }

                if (streamClient && streamClient.userID) {
                    const householdId = session.user.householdId;
                    const channelId = `household-${householdId}`;

                    const householdChannel = streamClient.channel('messaging', channelId, {
                        members: [session.user.id],
                        created_by_id: session.user.id,
                    });

                    channelRef.current = householdChannel;

                    if (isComponentMounted) {
                        setChannelInstance(householdChannel);

                        try {
                            await householdChannel.watch();

                            // Load initial batch of messages with a smaller batch size
                            const initialMessageLimit = Math.min(20, messageLimit);
                            const channelResponse = await householdChannel.query({
                                messages: {
                                    limit: initialMessageLimit,
                                },
                            });

                            if (channelResponse.messages && isComponentMounted) {
                                // Set messages in a timeout to prevent UI freeze
                                setTimeout(() => {
                                    setMessages(channelResponse.messages);
                                    setHasMoreMessages(channelResponse.messages.length >= initialMessageLimit);
                                    setLoading(false);
                                    // Scroll to bottom after messages are rendered
                                    setTimeout(scrollToBottom, 200);
                                }, 10);
                            } else {
                                setLoading(false);
                            }

                            householdChannel.off('message.new');

                            householdChannel.on('message.new', (event) => {
                                if (event.message && isComponentMounted) {
                                    setMessages((prevMessages) => [...prevMessages, event.message as MessageResponse]);
                                    setTimeout(scrollToBottom, 100);
                                }
                            });
                        } catch (error) {
                            console.error('Error initializing channel:', error);
                            if (!streamClient.userID) {
                                clientRef.current = null;
                                setClient(null);
                                setChannelInstance(null);
                                channelRef.current = null;
                            }
                            setLoading(false);
                        }
                    }
                }
            } catch (err) {
                console.error('Error initializing chat:', err);
                clientRef.current = null;
                setClient(null);
                setChannelInstance(null);
                channelRef.current = null;

                if (isComponentMounted) {
                    setLoading(false);
                }
            } finally {
                reconnectingRef.current = false;
            }
        };

        if (userDataLoaded) {
            initStreamChat();
        }

        return () => {
            isComponentMounted = false;
        };
    }, [session, userDataLoaded, messageLimit, getUserProfilePicture]);

    useEffect(() => {
        return () => {
            if (clientRef.current) {
                clientRef.current.disconnectUser().catch((error) => {
                    console.error('Error disconnecting user:', error);
                });
                clientRef.current = null;
            }

            channelRef.current = null;
            setClient(null);
            setChannelInstance(null);
        };
    }, []);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputMessage.trim() || !session?.user?.id) return;

        try {
            const currentClient = clientRef.current;

            if (!currentClient || !currentClient.userID) {
                console.error('Cannot send message: client is not connected');
                return;
            }

            const householdId = session.user.householdId;
            const channelId = `household-${householdId}`;
            const channel = currentClient.channel('messaging', channelId);

            await channel.sendMessage({
                text: inputMessage,
                user_id: session.user.id,
            });

            setInputMessage('');
        } catch (error) {
            console.error('Error sending message:', error);

            if (clientRef.current && !clientRef.current.userID) {
                clientRef.current = null;
                setClient(null);
                setChannelInstance(null);
                channelRef.current = null;
            }
        }
    };
    const formatTime = (timestamp: string | Date | undefined) => {
        if (!timestamp) return '';

        const messageDate = new Date(timestamp);
        const now = new Date();

        const isToday = messageDate.toDateString() === now.toDateString();

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = messageDate.toDateString() === yesterday.toDateString();

        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const isWithinWeek = messageDate >= oneWeekAgo;

        const timeStr = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (isToday) {
            return timeStr;
        } else if (isYesterday) {
            return `Yesterday, ${timeStr}`;
        } else if (isWithinWeek) {
            return `${messageDate.toLocaleDateString(undefined, { weekday: 'short' })}, ${timeStr}`;
        } else {
            return (
                messageDate.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: now.getFullYear() !== messageDate.getFullYear() ? 'numeric' : undefined,
                }) + `, ${timeStr}`
            );
        }
    };

    const getUserName = (userId: string): string => {
        if (usersMap[userId]?.username) {
            return usersMap[userId].username;
        }

        return 'User';
    };

    const loadMoreMessages = useCallback(async () => {
        if (loadingMoreMessages || !hasMoreMessages || !channelInstance) return;

        setLoadingMoreMessages(true);

        try {
            const response = await channelInstance.query({
                messages: {
                    limit: messageLimit,
                    id_lt: messages[0]?.id,
                },
            });

            if (response.messages && response.messages.length > 0) {
                const container = messagesContainerRef.current;
                const oldScrollHeight = container?.scrollHeight || 0;

                // Add new messages to state in batches to prevent UI freezing
                setTimeout(() => {
                    setMessages((prevMessages) => [...response.messages, ...prevMessages]);
                    setHasMoreMessages(response.messages.length >= messageLimit);

                    // Maintain scroll position after loading more messages
                    setTimeout(() => {
                        if (container) {
                            const newScrollHeight = container.scrollHeight;
                            const heightDiff = newScrollHeight - oldScrollHeight;
                            container.scrollTop = heightDiff;
                        }
                        setLoadingMoreMessages(false);
                    }, 50);
                }, 10);
            } else {
                setHasMoreMessages(false);
                setLoadingMoreMessages(false);
            }
        } catch (error) {
            console.error('Error loading more messages:', error);
            setLoadingMoreMessages(false);
        }
    }, [loadingMoreMessages, hasMoreMessages, channelInstance, messageLimit, messages]);

    useEffect(() => {
        const handleScroll = () => {
            if (messagesContainerRef.current) {
                const { scrollTop } = messagesContainerRef.current;

                if (scrollTop === 0 && hasMoreMessages && !loadingMoreMessages) {
                    loadMoreMessages();
                }
            }
        };

        const container = messagesContainerRef.current;
        container?.addEventListener('scroll', handleScroll);

        return () => {
            container?.removeEventListener('scroll', handleScroll);
        };
    }, [loadMoreMessages, hasMoreMessages, loadingMoreMessages]);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            const visible = document.visibilityState === 'visible';
            setIsTabVisible(visible);

            if (visible) {
                const currentClient = clientRef.current;

                if (currentClient && !currentClient.userID) {
                    reconnectingRef.current = true;

                    try {
                        clientRef.current = null;
                        setClient(null);
                        setChannelInstance(null);
                        channelRef.current = null;

                        setTimeout(() => {
                            reconnectingRef.current = false;
                        }, 100);
                    } catch (error) {
                        console.error('Error resetting client on tab visibility change:', error);
                        reconnectingRef.current = false;
                    }
                }
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, []);

    if (!session?.user?.householdId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-zinc-50">
                <h2 className="text-2xl font-bold mb-4">No Household</h2>
                <p className="text-center mb-6">You need to be part of a household to use the messaging feature.</p>
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
                                className="flex-1 bg-zinc-800 border-0 rounded-full px-4 py-2 text-zinc-50 focus:outline-hidden"
                            />

                            <button
                                type="submit"
                                disabled={!inputMessage.trim()}
                                className="ml-2 w-8 h-8 flex items-center justify-center text-zinc-400 disabled:text-zinc-600 rounded hover:bg-zinc-800"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex h-full bg-zinc-950 text-zinc-50 flex-col md:flex-row">
            <div className="w-full md:w-72 border-b md:border-r md:border-b-0 border-zinc-800 overflow-y-auto md:h-full max-h-[200px] md:max-h-full">
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

            <div className="flex-1 flex flex-col h-[calc(100vh-240px)] md:h-full">
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-zinc-950">
                    <div className="w-full mx-auto">
                        {loadingMoreMessages && (
                            <div className="flex justify-center items-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-zinc-400"></div>
                            </div>
                        )}
                        {!hasMoreMessages && messages.length > messageLimit && (
                            <div className="text-center py-2 text-sm text-zinc-500">No more messages to load</div>
                        )}
                        {messages.map((message) => {
                            const isCurrentUser = message.user?.id === session?.user?.id;
                            const userName = message.user?.id ? getUserName(message.user.id) : 'User';
                            const profilePicture = message.user?.id
                                ? getUserProfilePicture(message.user.id)
                                : DEFAULT_AVATAR.imageUrl;

                            if (isCurrentUser) {
                                return (
                                    <div key={message.id} className="mb-4 flex justify-end mx-4">
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
                                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-800">
                                                <Image
                                                    src={profilePicture}
                                                    alt="Your avatar"
                                                    width={32}
                                                    height={32}
                                                    className="object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={message.id} className="mb-4 flex justify-start mx-4">
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mr-2 bg-zinc-800">
                                                <Image
                                                    src={profilePicture}
                                                    alt={userName}
                                                    width={32}
                                                    height={32}
                                                    className="object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center mb-1">
                                                    <span className="text-sm text-zinc-50 mr-2">{userName}</span>
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

                <div className="p-3 border-t border-zinc-800 bg-zinc-950 sticky bottom-0">
                    <form onSubmit={sendMessage} className="flex items-center">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Aa..."
                            className="flex-1 bg-zinc-800 border-0 rounded-full px-4 py-2 text-zinc-50 focus:outline-hidden"
                        />

                        <button
                            type="submit"
                            disabled={!inputMessage.trim()}
                            className="ml-2 w-8 h-8 flex items-center justify-center text-zinc-400 disabled:text-zinc-600 rounded hover:bg-zinc-800"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
