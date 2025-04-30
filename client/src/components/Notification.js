import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../contexts/NotificationContext';

function Notification() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg p-4 shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 text-red-800'
              : 'bg-blue-50 text-blue-800'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 flex-shrink-0"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Notification; 