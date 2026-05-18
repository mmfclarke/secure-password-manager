import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Check, Circle } from "lucide-react";
import styles from "../styles/Register.module.css";

export default function Register({ setMasterPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requirements = [
    { key: "length", label: "At least 12 characters", met: password.length >= 12 },
    { key: "upper", label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { key: "lower", label: "One lowercase letter", met: /[a-z]/.test(password) },
    { key: "number", label: "One number", met: /[0-9]/.test(password) },
    { key: "special", label: "One special character", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const allMet = requirements.every((r) => r.met);

  const handleRegister = async () => {
    setError("");

    if (!allMet) {
      setError("Password does not meet all requirements");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", { email, password });
      flushSync(() => setMasterPassword(password));
      localStorage.setItem("userId", data.userId);
      navigate("/mfa-setup");
    } catch (err) {
      setMasterPassword("");
      setError(err.response?.data?.message || "Registration failed");
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
          <ul className={styles.requirements}>
            {requirements.map((r) => (
              <li key={r.key} className={r.met ? styles.met : styles.unmet}>
                {r.met ? <Check size={12} /> : <Circle size={12} />}
                {r.label}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Confirm Master Password</label>
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.button}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
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
