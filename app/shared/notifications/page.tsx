"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "tender" | "deadline" | "response" | "estimation" | "document" | "similar" | "stage" | "view" | "price" | "inquiry" | "collaboration" | "project";
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "tender": return "📋";
    case "deadline": return "⏰";
    case "response": return "💬";
    case "estimation": return "📊";
    case "document": return "📄";
    case "similar": return "🔍";
    case "stage": return "🔄";
    case "view": return "👁️";
    case "price": return "💰";
    case "inquiry": return "📧";
    case "collaboration": return "🤝";
    case "project": return "📦";
    default: return "🔔";
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "tender": return "bg-blue-100";
    case "deadline": return "bg-red-100";
    case "response": return "bg-green-100";
    case "estimation": return "bg-purple-100";
    case "document": return "bg-yellow-100";
    case "similar": return "bg-indigo-100";
    case "stage": return "bg-orange-100";
    case "view": return "bg-cyan-100";
    case "price": return "bg-emerald-100";
    case "inquiry": return "bg-pink-100";
    case "collaboration": return "bg-violet-100";
    case "project": return "bg-amber-100";
    default: return "bg-gray-100";
  }
};

export default function SharedNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
    
    if (storedUserId) {
      fetchNotifications(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?userId=${userId}`);
      const data = await response.json();
      
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      });
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => window.history.back()} className="text-gray-600">
            ← بازگشت
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            اعلان‌ها
            {unreadCount > 0 && (
              <span className="mr-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <button 
            onClick={() => {
              // Mark all as read
              notifications.forEach(n => {
                if (!n.read) markAsRead(n.id);
              });
            }}
            className="text-blue-600 text-sm"
          >
            همه را خوانده‌شده
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="pb-20">
        {notifications.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-96 p-8">
            <span className="text-6xl mb-4">🔔</span>
            <p className="text-gray-600 text-center">هیچ اعلانی وجود ندارد</p>
          </div>
        )}

        {notifications.map((notification) => {
          const NotificationContent = (
            <div 
              className={`p-4 border-b border-gray-100 ${
                !notification.read ? "bg-blue-50" : "bg-white"
              }`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time}</p>
                </div>
              </div>
            </div>
          );

          if (notification.actionUrl) {
            return (
              <Link key={notification.id} href={notification.actionUrl}>
                {NotificationContent}
              </Link>
            );
          }

          return <div key={notification.id}>{NotificationContent}</div>;
        })}
      </div>
    </div>
  );
}
