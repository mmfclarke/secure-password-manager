import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/Vault.module.css";
import { Key, Lock, Plus, Pencil, Trash2, Copy, Check, Eye, EyeOff, ExternalLink } from "lucide-react";
import PasswordGenerator from "../components/PasswordGenerator";
import { encrypt, decrypt } from "../utils/crypto";
import { copyToClipboard } from "../utils/clipboard";

const FILTERS = ["All", "Personal", "Work", "Finance", "Social", "Other"];

export default function Vault({ masterPassword, setMasterPassword }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showGenerator, setShowGenerator] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", username: "", password: "", website: "", category: "other" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingCred, setEditingCred] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", username: "", password: "", website: "", category: "other" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingCred, setDeletingCred] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [copiedField, setCopiedField] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!masterPassword) {
      setUnlocking(true);
      setLoading(false);
      return;
    }

    setUnlocking(false);
    setLoading(true);
    const fetchCredentials = async () => {
      try {
        const { data } = await axios.get("/api/credentials", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let decrypted;
        try {
          decrypted = data.map((cred) => {
            const { username, password } = JSON.parse(
              decrypt(cred.encryptedData.ciphertext, cred.encryptedData.iv, cred.encryptedData.salt, masterPassword)
            );
            return { ...cred, username, password };
          });
        } catch {
          setMasterPassword("");
          setUnlockError("Incorrect master password. Try again.");
          return;
        }

        setCredentials(decrypted);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError("Failed to load credentials");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [masterPassword, navigate]);

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text, id, field) => {
    copyToClipboard(text);
    setCopiedField({ id, field });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const handleUnlock = () => {
    if (!unlockInput) {
      setUnlockError("Enter your master password");
      return;
    }
    setUnlockError("");
    setMasterPassword(unlockInput);
    setUnlockInput("");
  };

  const handleAdd = async () => {
    if (!addForm.title || !addForm.username || !addForm.password) {
      setAddError("Title, username, and password are required");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const token = localStorage.getItem("token");
      const encryptedData = encrypt(
        JSON.stringify({ username: addForm.username, password: addForm.password }),
        masterPassword
      );
      const { data } = await axios.post("/api/credentials", {
        title: addForm.title,
        website: addForm.website || null,
        category: addForm.category,
        encryptedData,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setCredentials((prev) => [...prev, { ...data, username: addForm.username, password: addForm.password }]);
      setShowAddForm(false);
      setAddForm({ title: "", username: "", password: "", website: "", category: "other" });
      showSuccess("Credential saved.");
    } catch (err) {
      setAddError(err.response?.data?.error || "Failed to add credential");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (cred) => {
    setEditingCred(cred);
    setEditForm({ title: cred.title, username: cred.username, password: cred.password, website: cred.website || "", category: cred.category });
    setEditError("");
    setShowEditPassword(false);
  };

  const handleEdit = async () => {
    if (!editForm.title || !editForm.username || !editForm.password) {
      setEditError("Title, username, and password are required");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      const token = localStorage.getItem("token");
      const encryptedData = encrypt(
        JSON.stringify({ username: editForm.username, password: editForm.password }),
        masterPassword
      );
      const { data } = await axios.put(`/api/credentials/${editingCred._id}`, {
        title: editForm.title,
        website: editForm.website || null,
        category: editForm.category,
        encryptedData,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setCredentials((prev) => prev.map((c) =>
        c._id === editingCred._id ? { ...data, username: editForm.username, password: editForm.password } : c
      ));
      setEditingCred(null);
      showSuccess("Credential saved.");
    } catch (err) {
      setEditError(err.response?.data?.error || "Failed to update credential");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/credentials/${deletingCred._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCredentials((prev) => prev.filter((c) => c._id !== deletingCred._id));
      setDeletingCred(null);
      showSuccess("Credential deleted.");
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Failed to delete credential");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = credentials.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(search.toLowerCase()) ||
      cred.username.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "All" || cred.category === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={styles.page}>
      {unlocking && (
        <div className={styles.modalOverlay}>
          <div className={styles.unlockModal}>
            <Lock size={32} />
            <h2>Vault Locked</h2>
            <p>Enter your master password to unlock.</p>
            <div className={styles.formField}>
              <input
                type="password"
                placeholder="Master password"
                value={unlockInput}
                onChange={(e) => setUnlockInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                autoFocus
              />
            </div>
            {unlockError && <p className={styles.formError}>{unlockError}</p>}
            <button className={styles.submitBtn} onClick={handleUnlock}>Unlock</button>
          </div>
        </div>
      )}

      {showGenerator && (
        <PasswordGenerator
          onClose={() => setShowGenerator(false)}
          onSaveToVault={(generatedPassword) => {
            setShowGenerator(false);
            setAddForm({ title: "", username: "", password: generatedPassword, website: "", category: "other" });
            setShowAddPassword(false);
            setShowAddForm(true);
          }}
        />
      )}

      {showAddForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.formModal}>
            <h2>Add Credential</h2>
            <div className={styles.formField}>
              <label>Title</label>
              <input placeholder="e.g. Gmail" value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label>Username</label>
              <input placeholder="you@example.com" value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showAddPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                />
                <button className={styles.eyeToggle} onClick={() => setShowAddPassword((v) => !v)}>
                  {showAddPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className={styles.formField}>
              <label>Website <span className={styles.optional}>(optional)</span></label>
              <input placeholder="https://example.com" value={addForm.website} onChange={(e) => setAddForm({ ...addForm, website: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label>Category</label>
              <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}>
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="finance">Finance</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>
            {addError && <p className={styles.formError}>{addError}</p>}
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowAddForm(false); setAddError(""); setAddForm({ title: "", username: "", password: "", website: "", category: "other" }); setShowAddPassword(false); }}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleAdd} disabled={addLoading}>
                {addLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCred && (
        <div className={styles.modalOverlay}>
          <div className={styles.formModal}>
            <h2>Edit Credential</h2>
            <div className={styles.formField}>
              <label>Title</label>
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label>Username</label>
              <input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showEditPassword ? "text" : "password"}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
                <button className={styles.eyeToggle} onClick={() => setShowEditPassword((v) => !v)}>
                  {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className={styles.formField}>
              <label>Website <span className={styles.optional}>(optional)</span></label>
              <input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label>Category</label>
              <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="finance">Finance</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>
            {editError && <p className={styles.formError}>{editError}</p>}
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setEditingCred(null)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleEdit} disabled={editLoading}>
                {editLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingCred && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <Trash2 size={28} />
            <h2>Delete Credential?</h2>
            <p>"{deletingCred.title}" will be permanently removed.</p>
            {deleteError && <p className={styles.formError}>{deleteError}</p>}
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => { setDeletingCred(null); setDeleteError(""); }}>Cancel</button>
              <button className={styles.confirmLockBtn} onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLockConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <Lock size={28} />
            <h2>Lock Vault?</h2>
            <p>You'll be returned to the sign-in portal.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setShowLockConfirm(false)}>Cancel</button>
              <button className={styles.confirmLockBtn} onClick={() => { localStorage.removeItem("token"); setMasterPassword(""); navigate("/login"); }}>Lock Vault</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>🔐</div>
          <div className={styles.titleGroup}>
            <h1>Password Vault</h1>
            <p>{credentials.length} entries</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addBtn} onClick={() => { setShowAddForm(true); setShowAddPassword(false); }}><Plus size={14} /> Add</button>
          <button className={styles.headerBtn} onClick={() => setShowGenerator(true)}><Key size={14} /> Generate Password</button>
          <button className={styles.lockBtn} onClick={() => setShowLockConfirm(true)}><Lock size={14} /> Lock</button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Search and Filters */}
        <div className={styles.searchFilterRow}>
          <input
            className={styles.searchBox}
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={styles.filters}>
            {FILTERS.map((filter) => (
              <button
                key={filter}
                className={`${styles.filterBtn} ${
                  activeFilter === filter ? styles.active : ""
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Credential Cards */}
        {successMsg && <div className={styles.successToast}>{successMsg}</div>}
        {loading && <p className={styles.statusMsg}>Loading credentials...</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className={styles.statusMsg}>No credentials found.</p>
        )}
        {filtered.map((cred) => (
          <div key={cred._id} className={styles.credentialCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <span className={styles.cardTitle}>{cred.title}</span>
                <span className={styles.categoryBadge}>{cred.category}</span>
              </div>
              <div className={styles.cardActions}>
                <button className={styles.iconBtn} onClick={() => openEdit(cred)}><Pencil size={14} /></button>
                <button className={styles.iconBtn} onClick={() => setDeletingCred(cred)}><Trash2 size={14} /></button>
              </div>
            </div>

            <div className={styles.cardField}>
              <div className={styles.cardFieldLeft}>
                <span className={styles.fieldLabel}>Username</span>
                <span className={styles.fieldValue}>{cred.username}</span>
              </div>
              <div className={styles.fieldActions}>
                <button className={styles.iconBtn} onClick={() => handleCopy(cred.username, cred._id, "username")}>
                  {copiedField?.id === cred._id && copiedField?.field === "username" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className={styles.cardField}>
              <div className={styles.cardFieldLeft}>
                <span className={styles.fieldLabel}>Password</span>
                <span className={styles.fieldValue}>
                  {visiblePasswords[cred._id] ? cred.password : "••••••••••••"}
                </span>
              </div>
              <div className={styles.fieldActions}>
                <button className={styles.iconBtn} onClick={() => togglePasswordVisibility(cred._id)}><Eye size={14} /></button>
                <button className={styles.iconBtn} onClick={() => handleCopy(cred.password, cred._id, "password")}>
                  {copiedField?.id === cred._id && copiedField?.field === "password" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {cred.website && (
              <div className={styles.cardField}>
                <div className={styles.cardFieldLeft}>
                  <span className={styles.fieldLabel}>Website</span>
                  <a
                    className={styles.fieldValue}
                    href={cred.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {cred.website} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
