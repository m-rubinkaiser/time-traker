import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill in all fields');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const inputStyle = { borderRadius: 'var(--radius-sm)', padding: '10px 14px' };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-card animate-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">⏱</div>
          <div className="auth-logo-name">Time<span>Track</span></div>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start tracking your time for free</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="topbar-search" style={inputStyle}>
              <MdPerson style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="John Doe" value={form.name} onChange={set('name')} autoComplete="name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="topbar-search" style={inputStyle}>
              <MdEmail style={{ color: 'var(--text-muted)' }} />
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="topbar-search" style={inputStyle}>
              <MdLock style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                {showPass ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="topbar-search" style={inputStyle}>
              <MdLock style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: '24px 0 20px' }}>or</div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
