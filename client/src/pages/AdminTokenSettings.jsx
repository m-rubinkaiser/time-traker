import { useEffect, useState } from 'react';
import useAdminStore from '../store/adminStore';
import toast from 'react-hot-toast';
import { MdSettings, MdVpnKey, MdSecurity, MdRefresh, MdPowerSettingsNew, MdSave } from 'react-icons/md';

export default function AdminTokenSettings() {
  const { tokenConfig, fetchTokenConfig, updateTokenConfig, regenerateSecretKey, forceLogoutAll, loading } = useAdminStore();
  const [tokenExpiry, setTokenExpiry] = useState('7d');
  const [trialDays, setTrialDays] = useState(14);
  const [subAmount, setSubAmount] = useState(50);
  const [activationToken, setActivationToken] = useState('RUBIN-ACTIVATE');
  const [notificationTimes, setNotificationTimes] = useState(['06:00']);
  const [newTime, setNewTime] = useState('09:00');
  
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);

  useEffect(() => {
    fetchTokenConfig();
  }, [fetchTokenConfig]);

  useEffect(() => {
    if (tokenConfig) {
      setTokenExpiry(tokenConfig.tokenExpiry);
      setTrialDays(tokenConfig.subscriptionTrialDays);
      setSubAmount(tokenConfig.subscriptionAmount);
      setActivationToken(tokenConfig.activationToken || 'RUBIN-ACTIVATE');
      setNotificationTimes(tokenConfig.notificationTimes || ['06:00']);
    }
  }, [tokenConfig]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const res = await updateTokenConfig({
      tokenExpiry,
      subscriptionTrialDays: parseInt(trialDays, 10),
      subscriptionAmount: parseFloat(subAmount),
      activationToken,
      notificationTimes
    });
    if (res.success) {
      toast.success('System settings updated successfully.');
      fetchTokenConfig();
    } else {
      toast.error(res.message);
    }
  };

  const handleRegenerateKey = async () => {
    setShowKeyConfirm(false);
    toast.loading('Regenerating global JWT secret key and logging users out...');
    const res = await regenerateSecretKey();
    toast.dismiss();

    if (res.success) {
      toast.success('API Signing Secret regenerated. All user sessions invalidated.');
      fetchTokenConfig();
    } else {
      toast.error(res.message);
    }
  };

  const handleForceLogoutAll = async () => {
    setShowLogoutAllConfirm(false);
    toast.loading('Invalidating all active sessions...');
    const res = await forceLogoutAll();
    toast.dismiss();

    if (res.success) {
      toast.success('All active user sessions have been terminated.');
    } else {
      toast.error(res.message);
    }
  };

  if (!tokenConfig) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <span className="spinner spinner-lg" />
        <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: 750, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">System & API Token Configuration</h1>
          <p className="page-subtitle">Configure token expiry, modify plans, and manage global security keys</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Core settings */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdSettings style={{ color: 'var(--accent)' }} /> Global Preferences
            </h3>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">JWT Token Expiry Duration</label>
                <input
                  type="text"
                  className="form-control"
                  value={tokenExpiry}
                  onChange={(e) => setTokenExpiry(e.target.value)}
                  placeholder="e.g. 7d, 24h, 30d"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Free Trial Period (Days)</label>
                <input
                  type="number"
                  className="form-control"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  min="0"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Monthly Subscription Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  min="0"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Global Activation Token / Promo Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={activationToken}
                  onChange={(e) => setActivationToken(e.target.value)}
                  placeholder="e.g. RUBIN-ACTIVATE"
                  style={{ letterSpacing: 1 }}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Daily Task Reminder Alert Times
                </label>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                  Configure one or more times during the day when the server will run the daily email notification scan.
                </span>
                
                {/* Time badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {notificationTimes.length === 0 ? (
                    <span style={{ fontSize: 13, color: 'var(--orange)', fontStyle: 'italic' }}>No alerts scheduled. Choose a time below to add.</span>
                  ) : (
                    notificationTimes.map((time, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          background: 'var(--bg-elevated)', 
                          border: '1px solid var(--border)',
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--text)'
                        }}
                      >
                        <span>⏱️ {time}</span>
                        <button
                          type="button"
                          onClick={() => setNotificationTimes(notificationTimes.filter((_, i) => i !== idx))}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--danger)', 
                            cursor: 'pointer', 
                            fontSize: 16,
                            fontWeight: 'bold',
                            padding: '0 2px',
                            lineHeight: 1
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Time selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="time"
                    className="form-control"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    style={{ maxWidth: 160 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (!newTime) return;
                      if (notificationTimes.includes(newTime)) {
                        toast.error('This alert time is already scheduled.');
                        return;
                      }
                      setNotificationTimes([...notificationTimes, newTime].sort());
                      toast.success(`Scheduled alert slot at ${newTime}. Save settings to apply.`);
                    }}
                  >
                    Add Alert Time
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdSave size={18} /> Save Settings
            </button>
          </form>
        </div>

        {/* Security / API config */}
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
              <MdSecurity /> Critical Security & Session Control
            </h3>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 16, borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Active Signing Method:</span>
              <span className="badge badge-completed">JWT HS256 Standard</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Current Token Secret (Masked):</span>
              <code style={{ background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 4, color: 'var(--cyan)' }}>{tokenConfig.maskedSecret}</code>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Force Logout all */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Force Logout All Users</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invalidates active API sessions immediately. Users will need to log back in.</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowLogoutAllConfirm(true)}
                style={{ color: 'var(--orange)', borderColor: 'rgba(249,115,22,0.3)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <MdPowerSettingsNew size={16} /> Invalidate All Sessions
              </button>
            </div>

            {/* Key rotation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: 'var(--danger)' }}>Rotate API Signing Key</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Generates a new global JWT cryptographic secret key. Instantly invalidates all signatures and forces logout system-wide.</span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowKeyConfirm(true)}
                style={{ background: 'var(--danger)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <MdRefresh size={16} /> Rotate JWT Key
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REGENERATE KEY DIALOG */}
      {showKeyConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 450, borderColor: 'var(--danger)' }}>
            <h2 className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ Rotate API Cryptographic Key?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '12px 0 20px 0' }}>
              Rotating the key changes the cryptographic signature used to build and verify your tokens. 
              <strong> This will instantly log out every user currently using the system, including yourself.</strong>
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowKeyConfirm(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleRegenerateKey} style={{ background: 'var(--danger)' }}>Rotate & Terminate All Sessions</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT ALL DIALOG */}
      {showLogoutAllConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 450 }}>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ Invalidate All Active Sessions?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '12px 0 20px 0' }}>
              This increments the token version check globally. All existing API tokens in localStorage will be rejected on the next request, forcing a full relog.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowLogoutAllConfirm(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleForceLogoutAll} style={{ background: 'var(--orange)', color: '#fff' }}>Yes, Log Out All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
