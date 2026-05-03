import React, { useEffect, useState } from "react";
import { participantAPI } from "../utils/api";
import styles from "../styles/NotificationPanel.module.css";
import { FiX } from "react-icons/fi";

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await participantAPI.getNotifications();
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await participantAPI.markNotificationAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      training_created: "📚",
      training_updated: "✏️",
      training_cancelled: "❌",
      registration_confirmed: "✅",
      certificate_issued: "🏆",
      reminder: "🔔",
    };
    return icons[type] || "📢";
  };

  const getNotificationColor = (type) => {
    const colors = {
      training_created: styles.notifBlue,
      training_updated: styles.notifYellow,
      training_cancelled: styles.notifRed,
      registration_confirmed: styles.notifGreen,
      certificate_issued: styles.notifPurple,
      reminder: styles.notifOrange,
    };
    return colors[type] || styles.notifGray;
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return notificationDate.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.panelOverlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Notifications</h2>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount} unread</span>
            )}
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close notifications"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.panelContent}>
          {loading ? (
            <div className={styles.loading}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔔</div>
              <p>No notifications yet</p>
              <span>You're all caught up!</span>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`${styles.notificationItem} ${
                    !notif.read ? styles.notificationUnread : ""
                  }`}
                  onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                >
                  <div className={`${styles.notifIcon} ${getNotificationColor(notif.type)}`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className={styles.notifContent}>
                    <h4 className={styles.notifTitle}>{notif.title}</h4>
                    <p className={styles.notifMessage}>{notif.message}</p>
                    {notif.data?.trainingTitle && (
                      <p className={styles.notifTraining}>
                        Training: {notif.data.trainingTitle}
                      </p>
                    )}
                    <span className={styles.notifTime}>
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.read && (
                    <div className={styles.unreadIndicator}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className={styles.panelFooter}>
            <button className={styles.clearAllBtn}>
              Clear All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
