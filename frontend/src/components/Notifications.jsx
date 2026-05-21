import { useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../services/socketService";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    connectSocket((notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 3));
    });

    return () => disconnectSocket();
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-50 w-80 space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-2xl border border-sky-200 bg-white p-4 shadow-xl"
        >
          <p className="text-sm font-semibold text-slate-900">
            {notification.title}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {notification.message}
          </p>
        </div>
      ))}
    </div>
  );
}
