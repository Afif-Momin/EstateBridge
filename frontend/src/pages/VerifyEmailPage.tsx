import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { ROUTES } from '../constants';

type Status = 'loading' | 'success' | 'invalid' | 'expired' | 'error';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const token = searchParams.get('token');

    if (!token) {
      setStatus('invalid');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus('success');
          // Redirect to login after 4 seconds
          setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 4000);
        } else {
          const code: string = data?.error?.code ?? '';
          if (code === 'INVALID_TOKEN') {
            // Could be expired or invalid; message distinguishes them
            const msg: string = data?.error?.message ?? '';
            setStatus(msg.toLowerCase().includes('expired') ? 'expired' : 'invalid');
          } else {
            setStatus('error');
          }
        }
      } catch {
        setStatus('error');
      }
    };

    verify();
  }, [searchParams, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendStatus('sending');
    try {
      const res = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.RESEND_VERIFICATION}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resendEmail.trim() }),
        }
      );
      const data = await res.json();
      setResendStatus(res.ok && data.success ? 'sent' : 'failed');
    } catch {
      setResendStatus('failed');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / brand */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🏡</span>
          <span style={styles.brandText}>Estate Bridge</span>
        </div>

        {/* ── LOADING ── */}
        {status === 'loading' && (
          <div style={styles.section}>
            <div style={styles.spinner} />
            <h1 style={styles.title}>Verifying your email…</h1>
            <p style={styles.subtitle}>Please wait a moment.</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === 'success' && (
          <div style={styles.section}>
            <div style={{ ...styles.iconCircle, background: '#d1fae5' }}>
              <span style={{ fontSize: 36 }}>✅</span>
            </div>
            <h1 style={{ ...styles.title, color: '#065f46' }}>Email Verified!</h1>
            <p style={styles.subtitle}>
              Your account is now active. You'll be redirected to the login page in a few seconds.
            </p>
            <Link to={ROUTES.LOGIN} style={styles.btn}>
              Go to Login
            </Link>
          </div>
        )}

        {/* ── INVALID TOKEN ── */}
        {status === 'invalid' && (
          <div style={styles.section}>
            <div style={{ ...styles.iconCircle, background: '#fee2e2' }}>
              <span style={{ fontSize: 36 }}>❌</span>
            </div>
            <h1 style={{ ...styles.title, color: '#991b1b' }}>Invalid Link</h1>
            <p style={styles.subtitle}>
              This verification link is invalid. It may have already been used or was malformed.
            </p>
            <ResendForm
              email={resendEmail}
              setEmail={setResendEmail}
              onSubmit={handleResend}
              resendStatus={resendStatus}
            />
          </div>
        )}

        {/* ── EXPIRED TOKEN ── */}
        {status === 'expired' && (
          <div style={styles.section}>
            <div style={{ ...styles.iconCircle, background: '#fef3c7' }}>
              <span style={{ fontSize: 36 }}>⏰</span>
            </div>
            <h1 style={{ ...styles.title, color: '#92400e' }}>Link Expired</h1>
            <p style={styles.subtitle}>
              This verification link has expired (links are valid for 24 hours). Enter your email to
              receive a fresh one.
            </p>
            <ResendForm
              email={resendEmail}
              setEmail={setResendEmail}
              onSubmit={handleResend}
              resendStatus={resendStatus}
            />
          </div>
        )}

        {/* ── GENERIC ERROR ── */}
        {status === 'error' && (
          <div style={styles.section}>
            <div style={{ ...styles.iconCircle, background: '#fce7f3' }}>
              <span style={{ fontSize: 36 }}>⚠️</span>
            </div>
            <h1 style={{ ...styles.title, color: '#9d174d' }}>Something went wrong</h1>
            <p style={styles.subtitle}>
              We couldn't reach the verification server. Please try again later or request a new
              link.
            </p>
            <ResendForm
              email={resendEmail}
              setEmail={setResendEmail}
              onSubmit={handleResend}
              resendStatus={resendStatus}
            />
          </div>
        )}

        <p style={styles.footer}>
          <Link to={ROUTES.LOGIN} style={styles.link}>
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

/* ── Resend sub-component ── */
interface ResendFormProps {
  email: string;
  setEmail: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  resendStatus: 'idle' | 'sending' | 'sent' | 'failed';
}

const ResendForm: React.FC<ResendFormProps> = ({ email, setEmail, onSubmit, resendStatus }) => (
  <form onSubmit={onSubmit} style={styles.resendForm}>
    {resendStatus === 'sent' ? (
      <p style={styles.resendSuccess}>
        ✅ A new verification email is on its way — check your inbox!
      </p>
    ) : (
      <>
        <p style={styles.resendLabel}>Send a new verification link:</p>
        <div style={styles.resendRow}>
          <input
            id="resend-email"
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <button
            id="resend-btn"
            type="submit"
            disabled={resendStatus === 'sending'}
            style={styles.resendBtn}
          >
            {resendStatus === 'sending' ? 'Sending…' : 'Resend'}
          </button>
        </div>
        {resendStatus === 'failed' && (
          <p style={styles.resendError}>Failed to send. Please try again or contact support.</p>
        )}
      </>
    )}
  </form>
);

/* ── Inline styles ── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #3b82f6 100%)',
    padding: '24px 16px',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    textAlign: 'center',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '32px',
  },
  brandIcon: { fontSize: '28px' },
  brandText: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1e3a5f',
    letterSpacing: '-0.5px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 52,
    height: 52,
    border: '5px solid #e5e7eb',
    borderTop: '5px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: 1.6,
    margin: 0,
  },
  btn: {
    display: 'inline-block',
    marginTop: '8px',
    background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
    color: '#fff',
    padding: '12px 32px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '15px',
    transition: 'opacity 0.2s',
  },
  resendForm: { width: '100%', marginTop: '8px' },
  resendLabel: { fontSize: '14px', color: '#6b7280', marginBottom: '10px', textAlign: 'left' },
  resendRow: { display: 'flex', gap: '8px' },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  resendBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  resendSuccess: { color: '#065f46', fontSize: '14px', fontWeight: 500, marginTop: '8px' },
  resendError: { color: '#dc2626', fontSize: '13px', marginTop: '6px', textAlign: 'left' },
  footer: { marginTop: '32px', fontSize: '14px' },
  link: { color: '#2563eb', textDecoration: 'none', fontWeight: 500 },
};

/* Inject the CSS keyframe for the spinner into the document head once */
if (typeof document !== 'undefined') {
  const id = '__verify-spinner-style';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(s);
  }
}

export default VerifyEmailPage;
