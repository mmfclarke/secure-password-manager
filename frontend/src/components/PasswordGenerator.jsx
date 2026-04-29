import { useState, useEffect, useCallback } from "react";
import { X, Copy, RefreshCw } from "lucide-react";
import styles from "../styles/PasswordGenerator.module.css";

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  special: "!@#$%^&*()-_=+[]{}|;:,.<>?",
};

function generatePassword(length, options) {
  const selected = Object.entries(CHARSETS).filter(([key]) => options[key]);
  if (selected.length === 0) return "";

  const pool = selected.map(([, chars]) => chars).join("");

  const randValues = new Uint32Array(length + selected.length);
  window.crypto.getRandomValues(randValues);

  let idx = 0;
  const required = selected.map(([, chars]) => chars[randValues[idx++] % chars.length]);
  const extra = Array.from({ length: length - required.length }, () => pool[randValues[idx++] % pool.length]);

  const all = [...required, ...extra];
  const shuffleRand = new Uint32Array(all.length);
  window.crypto.getRandomValues(shuffleRand);
  for (let i = all.length - 1; i > 0; i--) {
    const j = shuffleRand[i] % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.join("");
}

export default function PasswordGenerator({ onClose }) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: false,
  });
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    setPassword(generatePassword(length, options));
    setCopied(false);
  }, [length, options]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOption = (key) => {
    const next = { ...options, [key]: !options[key] };
    if (!Object.values(next).some(Boolean)) return;
    setOptions(next);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Password Generator</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.passwordDisplay}>
          <span className={styles.password}>{password || "—"}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.lengthRow}>
            <span className={styles.label}>Length</span>
            <span className={styles.lengthValue}>{length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.section}>
          <span className={styles.label}>Character Types</span>
          <div className={styles.checkboxes}>
            {[
              { key: "uppercase", label: "Uppercase (A–Z)" },
              { key: "lowercase", label: "Lowercase (a–z)" },
              { key: "numbers",   label: "Numbers (0–9)" },
              { key: "special",   label: "Special (!@#...)" },
            ].map(({ key, label }) => (
              <label key={key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggleOption(key)}
                  className={styles.checkbox}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.generateBtn} onClick={generate}>
            <RefreshCw size={14} /> Regenerate
          </button>
          <button className={styles.saveBtn}>
            Save to Vault
          </button>
        </div>
      </div>
    </div>
  );
}
