import { useState, useEffect } from 'react';
import useSubscriptionStore from '../store/subscriptionStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdPayment, MdCheckCircleOutline, MdLock, MdLogout } from 'react-icons/md';

export default function Subscribe() {
  const { checkout, verifyPayment, loading } = useSubscriptionStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (orderId) {
      const verify = async () => {
        setVerifying(true);
        toast.loading('Verifying your payment transaction with Cashfree...');
        const res = await verifyPayment(orderId);
        toast.dismiss();
        setVerifying(false);
        if (res.success) {
          setSuccess(true);
          toast.success('Payment Verified! Welcome back.');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          toast.error(res.message || 'Payment verification failed');
        }
      };
      verify();
    }
  }, [searchParams, verifyPayment, navigate]);

  const handlePay = async () => {
    toast.loading('Initiating payment checkout...');
    const res = await checkout();
    toast.dismiss();

    if (res.success) {
      if (res.mock && res.paymentUrl) {
        toast.success('Redirecting to developer gateway...');
        setTimeout(() => {
          window.location.href = res.paymentUrl;
        }, 500);
      } else if (res.paymentSessionId) {
        toast.success('Opening secure payment checkout...');
        try {
          const cashfree = window.Cashfree({
            mode: res.mode || 'sandbox'
          });
          cashfree.checkout({
            paymentSessionId: res.paymentSessionId,
            redirectTarget: '_self'
          });
        } catch (sdkErr) {
          console.error('[Cashfree SDK] Initialization failed:', sdkErr);
          toast.error('Payment gateway initialization failed. Please reload page.');
        }
      } else {
        toast.error('Invalid payment configuration received.');
      }
    } else {
      toast.error(res.message || 'Failed to initialize payment');
    }
  };

  const [token, setToken] = useState('');
  const { activateWithToken } = useSubscriptionStore();

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Please enter a token');

    toast.loading('Validating activation token...');
    const res = await activateWithToken(token);
    toast.dismiss();

    if (res.success) {
      setSuccess(true);
      toast.success('Subscription activated successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      toast.error(res.message || 'Invalid activation token');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-card animate-in" style={{ maxWidth: 500 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">⏱</div>
          <div className="auth-logo-name">Time<span>Track</span></div>
        </div>

        {verifying ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span className="spinner spinner-lg" style={{ marginBottom: 16, display: 'inline-block' }} />
            <h1 className="auth-title">Confirming Payment</h1>
            <p className="auth-subtitle" style={{ marginBottom: 0 }}>
              Verifying your payment status with Cashfree...
            </p>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <MdCheckCircleOutline style={{ fontSize: 72, color: 'var(--success)', marginBottom: 16 }} />
            <h1 className="auth-title">Subscription Activated!</h1>
            <p className="auth-subtitle" style={{ marginBottom: 0 }}>
              Redirecting you to the dashboard...
            </p>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Plan Expired or Required</h1>
            <p className="auth-subtitle">
              Your free trial has ended, or you don't have an active subscription.
            </p>

            <div className="card" style={{ padding: 24, margin: '24px 0', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Premium Plan</h3>
                <span className="badge badge-completed" style={{ fontSize: 13, padding: '4px 10px' }}>Best Value</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Get unlimited access to advanced task management, automated time tracking, professional PDF/Excel reports, and 6 AM daily morning email summaries.
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>₹50</span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ month</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                className="btn btn-primary w-full btn-lg"
                onClick={handlePay}
                disabled={loading}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              >
                {loading ? <span className="spinner" /> : <MdPayment size={18} />}
                {loading ? 'Processing...' : 'Pay ₹50 / Month'}
              </button>

              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={handleLogout}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--border)' }}
              >
                <MdLogout size={16} />
                Logout Account
              </button>
            </div>

            <div className="auth-divider" style={{ margin: '24px 0 20px' }}>or</div>

            <form onSubmit={handleTokenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Activation Token"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  style={{ textAlign: 'center', letterSpacing: 1 }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary w-full"
                disabled={loading}
                style={{ border: '1px solid var(--border)' }}
              >
                Activate with Token
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <MdLock size={12} /> Secure Checkout Simulated with Razorpay
            </p>
          </>
        )}
      </div>
    </div>
  );
}
