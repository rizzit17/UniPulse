import React, { useState } from 'react';
import { api } from '../api/client';
import { User, UserRole } from '../types/api';

interface LoginRegisterScreenProps {
  onSuccess: (user: User) => void;
}

export const LoginRegisterScreen: React.FC<LoginRegisterScreenProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('student.alex@unipulse.edu');
  const [password, setPassword] = useState('password123');
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
          name: name || 'Campus User',
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
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: UserRole, demoEmail: string, demoName: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setRole(demoRole);
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(demoEmail, 'password123');
      onSuccess(res.user);
    } catch {
      // Offline fallback mock user
      const mockUser: User = {
        id: 'u-' + Math.random().toString(36).substring(2, 9),
        email: demoEmail,
        name: demoName,
        role: demoRole,
        campusId: 1,
      };
      onSuccess(mockUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant p-8 sm:p-10 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
            <span className="font-label-stamp text-label-stamp uppercase tracking-widest text-on-surface font-semibold">
              UNIPULSE
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-normal">
            {isRegister ? 'Create an account' : 'Sign in to UniPulse'}
          </h1>
          <p className="font-body-sm text-body-sm text-secondary m-0">
            Campus service requests and physical plant operations
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-surface-container-low p-1 border border-outline-variant font-title-sm text-title-sm">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`py-2 text-center transition-colors border-none cursor-pointer ${
              !isRegister
                ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                : 'text-secondary hover:text-on-surface bg-transparent'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`py-2 text-center transition-colors border-none cursor-pointer ${
              isRegister
                ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                : 'text-secondary hover:text-on-surface bg-transparent'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-error-container text-error text-body-sm border border-error/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div className="flex flex-col gap-1">
              <label className="font-label-caption text-label-caption text-secondary uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-surface-container-low border border-outline-variant px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-on-surface transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-label-caption text-label-caption text-secondary uppercase tracking-wider">
              University Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username@unipulse.edu"
              className="w-full bg-surface-container-low border border-outline-variant px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-on-surface transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-caption text-label-caption text-secondary uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container-low border border-outline-variant px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-on-surface transition-colors"
            />
          </div>

          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caption text-label-caption text-secondary uppercase tracking-wider">
                Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['STUDENT', 'TECHNICIAN', 'DEPARTMENT_HEAD', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-1.5 px-2 text-xs font-title-sm border transition-colors cursor-pointer ${
                      role === r
                        ? 'bg-primary text-on-primary border-primary font-semibold'
                        : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    {r === 'STUDENT'
                      ? 'Student'
                      : r === 'TECHNICIAN'
                      ? 'Tech'
                      : r === 'DEPARTMENT_HEAD'
                      ? 'Head'
                      : 'Admin'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-title-sm font-semibold tracking-wider transition-colors border-none cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Minimal 1-Click Demo Profiles */}
        <div className="pt-4 border-t border-outline-variant flex flex-col gap-2">
          <span className="font-label-caption text-label-caption text-secondary uppercase tracking-wider text-center">
            Demo quick sign-in
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('STUDENT', 'student.alex@unipulse.edu', 'Alex Rivera')}
              className="py-1.5 px-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-center font-body-sm text-body-sm text-on-surface transition-colors cursor-pointer"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('TECHNICIAN', 'tech.marcus@unipulse.edu', 'Marcus Vance')}
              className="py-1.5 px-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-center font-body-sm text-body-sm text-on-surface transition-colors cursor-pointer"
            >
              Tech
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('DEPARTMENT_HEAD', 'faculty.wright@unipulse.edu', 'Prof. Wright')}
              className="py-1.5 px-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-center font-body-sm text-body-sm text-on-surface transition-colors cursor-pointer"
            >
              Dept Head
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN', 'admin@unipulse.edu', 'Campus Admin')}
              className="py-1.5 px-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-center font-body-sm text-body-sm text-on-surface transition-colors cursor-pointer"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterScreen;
