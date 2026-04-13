import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/MFAPrompt.module.css";

export default function MFAPrompt() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logo}>🔐</div>
          <h1 className={styles.title}>Password Vault</h1>
        </div>
        <p className={styles.subtitle}>
          Enter the 6-digit code from your authenticator app
        </p>

        <div className={styles.field}>
          <label className={styles.label}>Authentication Code</label>
          <input
            className={styles.input}
            type="text"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <button
          className={styles.button}
          onClick={() => navigate("/vault")}
        >
          Verify
        </button>

        <p className={styles.hint}>
          Open your authenticator app to view your code
        </p>
      </div>
    </div>
  );
}
