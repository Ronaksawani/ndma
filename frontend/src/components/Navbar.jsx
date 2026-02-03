import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className={styles["navbar"]}>
      <div className={styles["navbar-container"]}>
        {/* Logo Section */}
        <Link to="/" className={styles["navbar-logo"]}>
          <div className={styles["logo-group"]}>
            <img
              src="/ndma-logo.png"
              alt="NDMA"
              className={styles["logo-icon"]}
              onError={(e) =>
                (e.target.src =
                  "https://via.placeholder.com/40?text=NDMA")
              }
            />
            <div className={styles["logo-text"]}>
              <div className={styles["logo-title"]}>NDMA</div>
              <div className={styles["logo-subtitle"]}>Training Portal</div>
            </div>
          </div>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className={styles["mobile-toggle"]}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Navigation Links */}
        <div
          className={`${styles["navbar-menu"]} ${
            mobileMenuOpen ? styles["active"] : ""
          }`}
        >
          <Link
            to="/"
            className={styles["nav-link"]}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>

          {isAuthenticated && user?.role === "partner" && (
            <Link
              to="/partner/dashboard"
              className={styles["nav-link"]}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}

          <Link
            to="/calendar"
            className={styles["nav-link"]}
            onClick={() => setMobileMenuOpen(false)}
          >
            Calendar
          </Link>

          <Link
            to="/resources"
            className={styles["nav-link"]}
            onClick={() => setMobileMenuOpen(false)}
          >
            Resources
          </Link>

          <Link
            to="/verify"
            className={styles["nav-link"]}
            onClick={() => setMobileMenuOpen(false)}
          >
            Verify
          </Link>

          {/* Right Section - Auth Buttons */}
          <div className={styles["nav-right"]}>
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className={`${styles["nav-link"]} ${styles["login-btn"]}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </>
            ) : (
              <div className={styles["user-menu"]}>
                <div className={styles["user-info"]}>
                  <span className={styles["user-name"]}>
                    {user?.contactPerson || user?.email}
                  </span>
                  <span className={styles["user-role"]}>
                    {user?.role === "partner" ? "Partner" : "Admin"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={styles["logout-btn"]}
                  title="Logout"
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
