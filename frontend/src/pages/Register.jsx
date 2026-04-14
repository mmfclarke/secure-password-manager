import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Register.module.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logo}>🔐</div>
          <h1 className={styles.title}>Password Vault</h1>
        </div>
        <p className={styles.subtitle}>Create your account</p>

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
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Confirm Master Password</label>
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <button
          className={styles.button}
          onClick={() => navigate("/mfa")}
        >
          Create Account
        </button>

        <p className={styles.footer}>
          Already have an account?{" "}
          <span className={styles.link} onClick={() => navigate("/login")}>
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}
