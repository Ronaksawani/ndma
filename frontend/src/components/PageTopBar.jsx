import React from "react";
import { FiBell } from "react-icons/fi";
import styles from "../styles/PageTopBar.module.css";

export default function PageTopBar({
  title,
  actions,
  notificationCount = 0,
  onNotificationsClick,
  notificationTooltip = "Recent Activities",
}) {
  return (
    <div className={styles.topBar}>
      <h2 className={styles.topBarTitle}>{title}</h2>
      <div className={styles.headerActions}>
        {actions}
        {typeof onNotificationsClick === "function" && (
          <button
            type="button"
            className={styles.notificationButton}
            title="Recent activities"
            onClick={onNotificationsClick}
          >
            <FiBell />
            {notificationCount > 0 && (
              <span className={styles.notificationCount}>
                {Math.min(notificationCount, 9)}
              </span>
            )}
            <span className={styles.notificationTooltip}>
              {notificationTooltip}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}