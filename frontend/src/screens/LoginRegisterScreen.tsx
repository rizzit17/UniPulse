import React, { useState } from 'react';
import { api } from '../api/client';
import { User, UserRole } from '../types/api';

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '5fr 7fr',
        minHeight: '100vh',
        backgroundColor: 'var(--paper)',
      }}
    >
      {/* Left Column: Ink Block */}
      <div
        style={{
          backgroundColor: 'var(--ink)',
          color: 'var(--paper)',
          padding: '64px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: 'var(--bw-heavy) solid var(--ink)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '32px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '64px',
                fontWeight: 900,
                color: 'var(--paper)',
                lineHeight: 1,
              }}
            >
              UP
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--amber)',
                letterSpacing: '0.04em',
              }}
            >
              UniPulse
            </span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--paper-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
            }}
          >
            MUNICIPAL-GRADE CAMPUS SERVICE PLATFORM
          </div>

          <p style={{ fontSize: '16px', color: 'var(--paper-2)', lineHeight: 1.6, maxWidth: '440px' }}>
            Centralized operations dispatcher for civil infrastructure, electrical systems, HVAC facilities, and IT networks.
          </p>
        </div>

        {/* Live operational count block */}
        <div
          style={{
            backgroundColor: '#1E1D15',
            border: 'var(--bw) solid var(--ink-2)',
            padding: '24px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--amber)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            LIVE OPERATIONAL TELEMETRY
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '48px',
              fontWeight: 800,
              color: 'var(--paper)',
              lineHeight: 1,
              marginBottom: '6px',
            }}
          >
            128
          </div>
          <div style={{ fontSize: '14px', color: 'var(--paper-2)' }}>
            requests open today across 4 departments
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div
        style={{
          padding: '64px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: '540px',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', marginBottom: '8px' }}>
            {isRegister ? 'REGISTER NEW ACCOUNT' : 'SECURE SIGN IN'}
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: '14px' }}>
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
              padding: '12px 16px',
              marginBottom: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 600,
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {isRegister && (
            <div>
              <label className="form-label" htmlFor="name-input">
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
              />
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="email-input">
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
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password-input">
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
            />
          </div>

          {isRegister && (
            <div>
              <label className="form-label" htmlFor="role-select">
                USER ROLE
              </label>
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="form-select"
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
            style={{ marginTop: '8px', padding: '12px 20px', width: '100%' }}
          >
            {loading ? 'AUTHENTICATING...' : isRegister ? 'REGISTER IDENTITY' : 'SIGN IN'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'underline',
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
            marginTop: '36px',
            paddingTop: '24px',
            borderTop: 'var(--bw) solid var(--paper-2)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--ink-2)',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            QUICK ROLE DEMO LOGINS:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => handlePresetLogin('STUDENT', 'aarav.student@unipulse.edu')}
              className="btn-brutalist btn-secondary"
              style={{ fontSize: '11px', padding: '6px' }}
            >
              STUDENT
            </button>
            <button
              onClick={() => handlePresetLogin('TECHNICIAN', 'ramesh.tech@unipulse.edu')}
              className="btn-brutalist btn-secondary"
              style={{ fontSize: '11px', padding: '6px' }}
            >
              TECHNICIAN
            </button>
            <button
              onClick={() => handlePresetLogin('DEPARTMENT_HEAD', 'priya.head@unipulse.edu')}
              className="btn-brutalist btn-secondary"
              style={{ fontSize: '11px', padding: '6px' }}
            >
              DEPT HEAD
            </button>
            <button
              onClick={() => handlePresetLogin('ADMIN', 'admin@unipulse.edu')}
              className="btn-brutalist btn-secondary"
              style={{ fontSize: '11px', padding: '6px' }}
            >
              ADMIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
