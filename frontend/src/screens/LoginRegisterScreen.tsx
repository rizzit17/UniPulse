import React, { useState } from 'react';
import { api } from '../api/client';
import { User, UserRole } from '../types/api';
import { UniPulseLogo } from '../components/UniPulseLogo';
import {
  Zap,
  Clock,
  ShieldCheck,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface LoginRegisterScreenProps {
  onSuccess: (user: User) => void;
}

export const LoginRegisterScreen: React.FC<LoginRegisterScreenProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({
          name,
          email,
          password,
          role,
        });
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick preset login helper for test & evaluation
  const handlePresetLogin = async (presetRole: UserRole, presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('PulsePass2026!');
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(presetEmail, 'PulsePass2026!');
      onSuccess(res.user);
    } catch {
      // In offline mock mode, construct user with desired role
      const mockUser: User = {
        id: 'u-' + presetRole.toLowerCase(),
        name: presetRole === 'STUDENT' ? 'Aarav Patel (Student)' :
              presetRole === 'TECHNICIAN' ? 'Ramesh Kumar (Tech)' :
              presetRole === 'DEPARTMENT_HEAD' ? 'Priya Sharma (Head)' : 'Campus Admin',
        email: presetEmail,
        role: presetRole,
        campusId: 1,
      };
      api.setAuth({
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: mockUser,
      });
      onSuccess(mockUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Column: Clean, Minimal Campus Service Intro */}
      <div
        style={{
          backgroundColor: 'var(--ink)',
          color: 'var(--paper)',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: 'var(--bw-heavy) solid var(--ink)',
          position: 'relative',
        }}
      >
        {/* Brand Header */}
        <div>
          <UniPulseLogo
            size="lg"
            theme="dark"
            subtitleText="SMART CAMPUS OPERATIONS"
            badgeText="PORTAL"
          />
        </div>

        {/* Minimal Hero Statement & Features */}
        <div style={{ margin: 'auto 0', maxWidth: '440px', padding: '32px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1E1D15',
              border: '1px solid #3A3728',
              padding: '4px 10px',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: 'var(--moss)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--paper-2)',
                letterSpacing: '0.04em',
              }}
            >
              CAMPUS DISPATCH PLATFORM
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 900,
              color: 'var(--paper)',
              lineHeight: 1.15,
              marginBottom: '14px',
              letterSpacing: '-0.02em',
            }}
          >
            Campus service requests, resolved fast.
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: 'var(--paper-2)',
              lineHeight: 1.6,
              marginBottom: '36px',
            }}
          >
            Report facility faults, track live technician updates, and keep campus operations running seamlessly.
          </p>

          {/* 3 Clean Feature Bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  backgroundColor: '#1E1D15',
                  border: '1px solid #3A3728',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--amber)',
                }}
              >
                <Zap size={16} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--paper)' }}>
                  Instant Smart Dispatch
                </div>
                <div style={{ fontSize: '12px', color: 'var(--paper-2)', marginTop: '2px', lineHeight: 1.4 }}>
                  Automated routing to the best available on-duty campus technician.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  backgroundColor: '#1E1D15',
                  border: '1px solid #3A3728',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--amber)',
                }}
              >
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--paper)' }}>
                  Transparent SLA Countdowns
                </div>
                <div style={{ fontSize: '12px', color: 'var(--paper-2)', marginTop: '2px', lineHeight: 1.4 }}>
                  Guaranteed resolution deadlines with live progress updates.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  backgroundColor: '#1E1D15',
                  border: '1px solid #3A3728',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--amber)',
                }}
              >
                <ShieldCheck size={16} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--paper)' }}>
                  Unified Campus Access
                </div>
                <div style={{ fontSize: '12px', color: 'var(--paper-2)', marginTop: '2px', lineHeight: 1.4 }}>
                  One streamlined portal for students, faculty, heads, and technicians.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid #28261D',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--moss)',
                display: 'inline-block',
                boxShadow: '0 0 0 2px rgba(91, 122, 58, 0.2)',
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--paper-2)' }}>
              All campus services operational
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--paper-2)' }}>
            UniPulse v1.0
          </span>
        </div>
      </div>

      {/* Right Column: Centered Elevated Neo-Brutalist Authentication Dossier */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 36px',
          minHeight: '100vh',
          backgroundColor: 'var(--paper)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--card)',
            border: 'var(--bw-heavy) solid var(--ink)',
            boxShadow: '6px 6px 0 var(--ink)',
            padding: '36px 32px',
          }}
        >
          {/* Card Top Meta Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              marginBottom: '20px',
              borderBottom: '2px solid var(--paper-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="var(--accent)" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ink-2)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                CAMPUS SSO GATEWAY
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--ink-3)',
                letterSpacing: '0.04em',
              }}
            >
              SECURE ACCESS
            </span>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 900,
                color: 'var(--ink)',
                lineHeight: 1.1,
                marginBottom: '8px',
                letterSpacing: '-0.02em',
              }}
            >
              {isRegister ? 'REGISTER NEW ACCOUNT' : 'SECURE SIGN IN'}
            </h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '14px', lineHeight: 1.5 }}>
              {isRegister
                ? 'Create your university credential to log service complaints.'
                : 'Sign in with your campus identity to manage or inspect tickets.'}
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#F7E7E2',
                border: 'var(--bw) solid var(--brick)',
                color: 'var(--brick)',
                padding: '12px 14px',
                marginBottom: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                fontWeight: 700,
              }}
              role="alert"
            >
              [AUTH-ERROR] {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {isRegister && (
              <div>
                <label className="form-label" htmlFor="name-input" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
                  FULL NAME
                </label>
                <input
                  id="name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Patel"
                  className="form-input"
                  style={{
                    height: '44px',
                    backgroundColor: 'var(--paper)',
                    border: '2px solid var(--ink)',
                    boxShadow: '2px 2px 0 var(--ink)',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}

            <div>
              <label className="form-label" htmlFor="email-input" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
                UNIVERSITY EMAIL
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="id@unipulse.edu"
                className="form-input"
                style={{
                  height: '44px',
                  backgroundColor: 'var(--paper)',
                  border: '2px solid var(--ink)',
                  boxShadow: '2px 2px 0 var(--ink)',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="password-input" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
                PASSWORD
              </label>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="form-input"
                style={{
                  height: '44px',
                  backgroundColor: 'var(--paper)',
                  border: '2px solid var(--ink)',
                  boxShadow: '2px 2px 0 var(--ink)',
                  fontSize: '14px',
                }}
              />
            </div>

            {isRegister && (
              <div>
                <label className="form-label" htmlFor="role-select" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
                  USER ROLE
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="form-select"
                  style={{
                    height: '44px',
                    backgroundColor: 'var(--paper)',
                    border: '2px solid var(--ink)',
                    boxShadow: '2px 2px 0 var(--ink)',
                    fontSize: '14px',
                  }}
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="FACULTY">FACULTY</option>
                  <option value="STAFF">STAFF</option>
                  <option value="TECHNICIAN">TECHNICIAN</option>
                  <option value="DEPARTMENT_HEAD">DEPARTMENT HEAD</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brutalist btn-primary"
              style={{
                height: '48px',
                marginTop: '6px',
                width: '100%',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-ink)',
                border: '2px solid var(--ink)',
                boxShadow: '4px 4px 0 var(--ink)',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'AUTHENTICATING...' : isRegister ? 'REGISTER IDENTITY' : 'SIGN IN'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div style={{ marginTop: '18px', textAlign: 'center' }}>
            <button
              onClick={() => setIsRegister(!isRegister)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'underline',
                letterSpacing: '0.02em',
                padding: '4px 8px',
              }}
            >
              {isRegister
                ? 'ALREADY REGISTERED? SIGN IN INSTEAD'
                : 'NEW TO UNIPULSE? REGISTER NEW ACCOUNT'}
            </button>
          </div>

          {/* Demo Fast Login Bar */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '2px dashed var(--paper-2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                QUICK ROLE DEMO LOGINS:
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--ink-3)',
                }}
              >
                1-CLICK AUTH
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handlePresetLogin('STUDENT', 'aarav.student@unipulse.edu')}
                className="btn-brutalist btn-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  border: '2px solid var(--ink)',
                  backgroundColor: 'var(--paper)',
                  boxShadow: '2px 2px 0 var(--ink)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '13px', color: 'var(--ink)' }}>
                    STUDENT
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, backgroundColor: 'var(--paper-2)', padding: '1px 5px', border: '1px solid var(--ink-3)' }}>
                    L1
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-2)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  aarav.student
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('TECHNICIAN', 'ramesh.tech@unipulse.edu')}
                className="btn-brutalist btn-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  border: '2px solid var(--ink)',
                  backgroundColor: 'var(--paper)',
                  boxShadow: '2px 2px 0 var(--ink)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '13px', color: 'var(--ink)' }}>
                    TECHNICIAN
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, backgroundColor: 'var(--paper-2)', padding: '1px 5px', border: '1px solid var(--ink-3)' }}>
                    L2
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-2)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  ramesh.tech
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('DEPARTMENT_HEAD', 'priya.head@unipulse.edu')}
                className="btn-brutalist btn-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  border: '2px solid var(--ink)',
                  backgroundColor: 'var(--paper)',
                  boxShadow: '2px 2px 0 var(--ink)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '13px', color: 'var(--ink)' }}>
                    DEPT HEAD
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, backgroundColor: 'var(--paper-2)', padding: '1px 5px', border: '1px solid var(--ink-3)' }}>
                    L3
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-2)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  priya.head
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('ADMIN', 'admin@unipulse.edu')}
                className="btn-brutalist btn-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  border: '2px solid var(--ink)',
                  backgroundColor: 'var(--paper)',
                  boxShadow: '2px 2px 0 var(--ink)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '13px', color: 'var(--ink)' }}>
                    ADMIN
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, backgroundColor: 'var(--amber)', color: 'var(--ink)', padding: '1px 5px', border: '1px solid var(--ink)' }}>
                    ROOT
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-2)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  admin@unipulse
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
