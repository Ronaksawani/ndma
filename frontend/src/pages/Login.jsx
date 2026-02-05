import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { authAPI } from "../utils/api";
import styles from "../styles/Login.module.css";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState(searchParams.get("role") || "partner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login(email, password, role);
      login(response.data.user, response.data.token);
      navigate(role === "admin" ? "/admin/dashboard" : "/partner/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles["login-container"]}>
        <div className={styles["login-card"]}>
          <div className={styles["login-header"]}>
            <h1 className={styles["login-title"]}>
              Disaster Management Portal
            </h1>
            <p className={styles["login-subtitle"]}>
              Real-Time Training Monitoring System
            </p>
          </div>

          <div className={styles["role-selector"]}>
            <button
              className={`${styles["role-btn"]} ${
                role === "partner" ? styles["active"] : ""
              }`}
              onClick={() => setRole("partner")}
            >
              Partner Login
            </button>
            <button
              className={`${styles["role-btn"]} ${
                role === "admin" ? styles["active"] : ""
              }`}
              onClick={() => setRole("admin")}
            >
              Admin Login
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className={styles["login-form"]}>
            <div className={styles["login-form-group"]}>
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={styles["login-form-group"]}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {/* <div className={styles["login-remember"]}>
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div> */}

            <button
              type="submit"
              className={styles["login-btn"]}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* <div className={styles["login-footer"]}>
            <div>
              <a href="#forgot">Forgot password?</a>
            </div>
          </div> */}
        </div>
      </div>
    </>
  );
}
