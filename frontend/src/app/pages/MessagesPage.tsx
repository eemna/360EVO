import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Search,
  Send,
  MoreVertical,
  Paperclip,
  ArrowLeft,
} from "lucide-react";
import { cn } from "../components/ui/utils";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import api from "../../services/axios";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";

interface User {
  id: string;
  name: string;
  profile?: {
    avatar?: string;
  };
}
interface Conversation {
  id: string;
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    profile?: {
      avatar?: string;
    };
  };
  lastMessage?: Message;
  unread: number;
  typing?: boolean;
  timestamp?: string;
}

interface Message {
  id: string;
  content: string;
  conversationId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    profile?: {
      avatar?: string;
    };
  };
}

export function MessagesPage() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [mobileView, setMobileView] = useState<"conversations" | "chat">(
    "conversations",
  );
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteConversation = async () => {
    if (!selectedConv) return;
    try {
      await api.delete(`/conversations/${selectedConv}`);
      const { data } = await api.get("/conversations");
      setConversations(data);
      setSelectedConv(data.length ? data[0].id : null);
      setMessages([]);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!showNewConversation) return;
    if (userSearch.trim().length < 1) {
      const timeout = setTimeout(() => setUsers([]), 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await api.get<User[]>(
          `/conversations/search?q=${userSearch}`,
        );
        setUsers(data);
      } catch {
        setUsers([]);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [userSearch, showNewConversation]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data: convs } = await api.get("/conversations");
        setConversations(
          convs.map((conv: Conversation) => ({
            ...conv,
            timestamp: conv.lastMessage
              ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
            typing: false,
          })),
        );
        if (convs.length > 0) {
          setSelectedConv(convs[0].id);
          setMessages([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConversations();
  }, []);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!selectedConv) return;
    const fetchMessages = async () => {
      try {
        const { data } = await api.get(
          `/conversations/${selectedConv}/messages`,
        );
        setMessages(data.messages);
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConv ? { ...conv, unread: 0 } : conv,
          ),
        );
        await api.put("/conversations/messages/read", {
          conversationId: selectedConv,
        });
        socket?.emit("join_conversation", selectedConv);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [selectedConv, socket]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === selectedConv) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id !== message.conversationId) return conv;
          return {
            ...conv,
            lastMessage: message,
            timestamp: new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread:
              message.conversationId === selectedConv
                ? conv.unread
                : conv.unread + 1,
          };
        });
        const conv = updated.find((c) => c.id === message.conversationId);
        const rest = updated.filter((c) => c.id !== message.conversationId);
        return conv ? [conv, ...rest] : updated;
      });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing_start", ({ userId }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.otherUser.id === userId ? { ...conv, typing: true } : conv,
        ),
      );
    });
    socket.on("typing_stop", ({ userId }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.otherUser.id === userId ? { ...conv, typing: false } : conv,
        ),
      );
    });
    socket.on("message_read", ({ conversationId, userId, lastReadAt }) => {
      if (conversationId !== selectedConv) return;
      if (userId === user?.id) return;
      setLastReadAt(lastReadAt);
    });
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_read");
      socket.off("typing_start");
      socket.off("typing_stop");
    };
  }, [socket, selectedConv, user?.id]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    socket?.emit("typing_start", { conversationId: selectedConv });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("typing_stop", { conversationId: selectedConv });
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return;
    try {
      await api.post(`/conversations/${selectedConv}/messages`, {
        content: messageInput,
      });
      setMessageInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConv);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex flex-col">
        <h1 className="text-3xl font-semibold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">
          Connect with team members and collaborators
        </p>
      </div>

      <Card className="flex flex-row h-[calc(100vh-180px)] shadow-xl overflow-hidden">
        {/* Conversations List */}
        <div
          className={cn(
            "border-r border-gray-200 bg-white flex flex-col shrink-0",
            "w-full md:w-80",
            mobileView === "conversations" ? "flex" : "hidden md:flex",
          )}
        >
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Conversations
            </h2>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                setUserSearch("");
                setShowNewConversation(true);
              }}
            >
              New Message
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedConv(conv.id);
                  setMobileView("chat");
                }}
                className={cn(
                  "flex w-full gap-3 border-b border-gray-100 p-4 text-left transition-all hover:bg-gray-50",
                  selectedConv === conv.id &&
                    "bg-indigo-50 border-l-4 border-l-indigo-600 hover:bg-indigo-50",
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                    <AvatarImage src={conv.otherUser?.profile?.avatar} />
                    <AvatarFallback>
                      {conv.otherUser?.name?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers.has(conv.otherUser.id) && (
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className={cn(
                        "font-semibold text-sm truncate", //Coupe avec ...
                        conv.unread > 0 && "text-gray-900",
                      )}
                    >
                      {conv.otherUser.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {conv.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        conv.unread > 0
                          ? "text-gray-900 font-medium"
                          : "text-gray-600",
                      )}
                    >
                      {conv.typing ? (
                        <span className="text-indigo-600 italic">
                          typing...
                        </span>
                      ) : conv.lastMessage ? (
                        conv.lastMessage.content
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                    {conv.unread > 0 && (
                      <Badge className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs text-white px-1.5 shadow-sm">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={cn(
            "flex flex-1 flex-col h-full bg-gradient-to-b from-gray-50 to-white min-w-0",
            mobileView === "chat" ? "flex" : "hidden md:flex",
          )}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-gray-900"
                onClick={() => setMobileView("conversations")}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                  <AvatarImage
                    src={selectedConversation?.otherUser?.profile?.avatar}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    {selectedConversation?.otherUser?.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {selectedConversation &&
                  onlineUsers.has(selectedConversation.otherUser.id) && (
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                  )}
              </div>
              <div className="font-semibold text-gray-900">
                {selectedConversation?.otherUser?.name}
              </div>
            </div>
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteDialog(true);
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Delete conversation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-6 py-6 flex flex-col"
          >
            <div className="flex flex-col w-full space-y-3">
              <div className="flex-grow" />
              {messages.map((message) => {
                const isMe = message.sender.id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-2",
                      isMe ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isMe && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender?.profile?.avatar} />
                        <AvatarFallback>
                          {message.sender?.name?.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col max-w-[70%]">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5",
                          isMe
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-gray-200",
                        )}
                      >
                        {message.content}
                      </div>
                      {isMe &&
                        lastReadAt &&
                        new Date(message.createdAt) <=
                          new Date(lastReadAt) && (
                          <div className="text-[10px] text-gray-400 mt-1 text-right">
                            Seen
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
            <div className="flex items-end gap-3 w-full">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <textarea
                value={messageInput}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 min-h-[42px] max-h-32 overflow-y-auto px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-indigo-300 focus:bg-white text-sm resize-none placeholder:text-gray-400"
              />
              <Button
                onClick={handleSendMessage}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                disabled={!messageInput.trim()}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 max-h-[500px] overflow-y-auto">
            <h2 className="font-semibold mb-4 text-lg">Start Conversation</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              {userSearch.length === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  Type a name to search users
                </p>
              )}
              {userSearch.length > 0 && users.length === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  No users found
                </p>
              )}
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={async () => {
                    setShowNewConversation(false);
                    try {
                      const { data } = await api.post("/conversations", {
                        otherUserId: u.id,
                      });
                      setSelectedConv(data.id);
                      socket?.emit("join_conversation", data.id);
                      const { data: convs } = await api.get("/conversations");
                      setConversations(
                        convs.map((conv: Conversation) => ({
                          ...conv,
                          timestamp: conv.lastMessage
                            ? new Date(
                                conv.lastMessage.createdAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "",
                          typing: false,
                        })),
                      );
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.profile?.avatar} />
                    <AvatarFallback>{u.name?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{u.name}</span>
                </button>
              ))}
            </div>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => setShowNewConversation(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Delete Conversation
            </DialogTitle>
            <DialogDescription>
              This will permanently delete this conversation and all messages.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleDeleteConversation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}