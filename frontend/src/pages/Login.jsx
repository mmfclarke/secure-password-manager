import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/Login.module.css";

export default function Login({ setMasterPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });

      if (data.requireMFA) {
        flushSync(() => setMasterPassword(password));
        localStorage.setItem("userId", data.userId);
        navigate("/mfa");
      } else if (data.requireMFASetup) {
        flushSync(() => setMasterPassword(password));
        localStorage.setItem("userId", data.userId);
        navigate("/mfa-setup");
      }
    } catch (err) {
      setMasterPassword("");
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logo}>🔐</div>
          <h1 className={styles.title}>Password Vault</h1>
        </div>
        <p className={styles.subtitle}>Sign in to your vault</p>

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Master Password</label>
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className={styles.footer}>
          Don't have an account?{" "}
          <span className={styles.link} onClick={() => navigate("/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
