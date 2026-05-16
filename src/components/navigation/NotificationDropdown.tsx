"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCircle2, CircleAlert, FileText, Share2, ShieldAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationType {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const { data } = await res.json();
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: NotificationType) => !n.read).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification._id}/read`, { method: "PUT" });
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === 'urgent') return <ShieldAlert className="size-4 text-destructive" />;
    switch (type) {
      case 'goal_approved': return <CheckCircle2 className="size-4 text-emerald-500" />;
      case 'goal_rejected': return <CircleAlert className="size-4 text-orange-500" />;
      case 'goal_submitted': return <FileText className="size-4 text-blue-500" />;
      case 'shared_goal_assigned': return <Share2 className="size-4 text-indigo-500" />;
      case 'team_assignment': return <Users className="size-4 text-purple-500" />;
      default: return <Bell className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
          <Bell className="size-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-1 right-1 size-4 bg-destructive text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-background"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      } />
      
      <DropdownMenuContent className="w-80 sm:w-96 p-0" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold text-base">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary font-medium" onClick={handleMarkAllAsRead}>
                <Check className="size-3 mr-1" /> Mark all read
              </Button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Bell className="size-8 opacity-20 mb-3" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif, index) => (
                <div key={notif._id}>
                  {index > 0 && <DropdownMenuSeparator className="m-0" />}
                  <DropdownMenuItem 
                    className={`p-4 cursor-pointer flex gap-3 items-start ${!notif.read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="mt-0.5 shrink-0 bg-background rounded-full p-1.5 border shadow-sm">
                      {getIcon(notif.type, notif.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className={`text-sm font-medium leading-none truncate ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={`text-xs leading-snug line-clamp-2 ${!notif.read ? 'text-muted-foreground/90 font-medium' : 'text-muted-foreground/70'}`}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="shrink-0 size-2 bg-primary rounded-full mt-2" />
                    )}
                  </DropdownMenuItem>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/20 text-center">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => router.push('/notifications')}>
              View All Activity
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
