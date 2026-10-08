import React, { useState } from 'react';
import { api } from '../api/client';
import { User, UserRole } from '../types/api';

interface LoginRegisterScreenProps {
  onSuccess: (user: User) => void;
}

export const LoginRegisterScreen: React.FC<LoginRegisterScreenProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('aarav.s26@univ.ac.in');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [department, setDepartment] = useState('Facilities & Maintenance');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
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
      const msg = err instanceof Error ? err.message : 'Authentication challenge failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetLogin = async (selectedRole: UserRole, presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password123');
    setRole(selectedRole);
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(presetEmail, 'password123');
      onSuccess(res.user);
    } catch {
      // Offline fallback mock user
      const mockUser: User = {
        id: 'u-' + Math.random().toString(36).substring(2, 9),
        email: presetEmail,
        name:
          selectedRole === 'ADMIN'
            ? 'Campus Administrator'
            : selectedRole === 'DEPARTMENT_HEAD'
            ? 'Prof. Arthur Wright'
            : selectedRole === 'TECHNICIAN'
            ? 'Marcus Vance'
            : 'Aarav Sharma',
        role: selectedRole,
        campusId: 1,
      };
      onSuccess(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const roleHints: Record<UserRole, string> = {
    STUDENT: '[REQ]: Student, Resident Scholar, Faculty, or Visiting Staff requesting physical plant aid.',
    FACULTY: '[REQ]: Academic Department Faculty filing classroom, research lab, or HVAC work orders.',
    STAFF: '[REQ]: University Operations Staff reporting facility and custodial incidents.',
    TECHNICIAN: '[TECH]: Certified Field Technician responding to dispatch work orders and equipment repairs.',
    DEPARTMENT_HEAD: '[DEPT]: Department Head overseeing trade queues, approving SLA waivers, and supervising teams.',
    ADMIN: '[ADMIN]: System Administrator with full campus registry, NOC routing, and telemetry access.',
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full flex justify-center">
        {/* Archival Docket Registry Container */}
        <div className="w-full max-w-xl flex flex-col bg-surface shadow-sm border border-outline-variant">
          
          {/* Header Block: Institutional Typography & Stamp */}
          <div className="bg-surface-container-low p-6 sm:p-8 flex flex-col items-center text-center border-b border-outline-variant">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 bg-primary"></span>
              <span className="font-label-stamp text-label-stamp uppercase tracking-widest text-secondary font-semibold">
                ARCHIVAL DISPATCH REGISTRY // SEC-01
              </span>
              <span className="w-2.5 h-2.5 bg-primary"></span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">domain_verification</span>
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface font-normal">
                UniPulse
              </h1>
            </div>

            <p className="font-body-sm text-body-sm text-secondary mt-1 max-w-md">
              Central University Infrastructure &amp; Services Portal · Facilities Management &amp; Physical Plant
            </p>

            <div className="mt-4 flex items-center gap-3 font-label-code text-label-code text-secondary bg-surface-container px-3 py-1 border border-outline-variant/60">
              <span>EDITION: 2026.04</span>
              <span>•</span>
              <span>NODE: BLK-ADMIN-GATE-01</span>
              <span>•</span>
              <span className="text-tertiary font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>ONLINE
              </span>
            </div>
          </div>

          {/* Dual Tab Mode Switcher (Manifest Folders) */}
          <div className="grid grid-cols-2 bg-surface-container font-title-sm text-title-sm border-b border-outline-variant">
            <button
              id="tab-signin"
              type="button"
              onClick={() => setIsRegister(false)}
              className={`py-3 px-4 text-center transition-colors flex items-center justify-center gap-2 cursor-pointer border-none ${
                !isRegister
                  ? 'bg-surface-container-lowest text-primary font-semibold border-b-2 border-primary'
                  : 'text-secondary hover:text-on-surface bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">badge</span>
              <span>Sign In (Authorized ID)</span>
            </button>

            <button
              id="tab-register"
              type="button"
              onClick={() => setIsRegister(true)}
              className={`py-3 px-4 text-center transition-colors flex items-center justify-center gap-2 cursor-pointer border-none ${
                isRegister
                  ? 'bg-surface-container-lowest text-primary font-semibold border-b-2 border-primary'
                  : 'text-secondary hover:text-on-surface bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>New Campus Account</span>
            </button>
          </div>

          {/* Manifest Slip Body */}
          <div className="bg-surface-container-lowest p-6 sm:p-8 flex flex-col gap-6">
            
            {/* SSO / LDAP Primary Channel */}
            <div className="flex flex-col gap-2">
              <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                Fast Lane Auth · Central Directory
              </span>
              <button
                type="button"
                onClick={() => handlePresetLogin('STUDENT', 'student.alex@unipulse.edu')}
                className="w-full bg-surface-container-low hover:bg-surface-container text-on-surface p-4 flex items-center justify-between text-left transition-colors border border-outline-variant/70 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">vpn_key</span>
                  <div>
                    <div className="font-title-sm text-title-sm font-semibold text-on-surface">
                      Continue with University SSO (LDAP / CAS)
                    </div>
                    <div className="font-label-code text-label-code text-secondary mt-0.5">
                      Single Sign-On for @unipulse.edu credentials
                    </div>
                  </div>
                </div>
                <span className="font-label-stamp text-label-stamp text-primary bg-primary-fixed px-2 py-0.5 font-bold">
                  FEDERATED
                </span>
              </button>
            </div>

            {/* Structural Receipt Perforation Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full bg-surface-container-high h-[1px]"></div>
              <span className="absolute bg-surface-container-lowest px-3 font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                OR MANUAL CREDENTIALS DOCKET
              </span>
            </div>

            {/* Dynamic Form Container */}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              
              {/* Role Selection Tabs */}
              <div className="flex flex-col gap-2">
                <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                  Access Scope &amp; Functional Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" id="role-selector">
                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    className={`role-pill py-2 px-2 text-center font-title-sm text-title-sm transition-colors text-xs border border-outline-variant cursor-pointer ${
                      role === 'STUDENT'
                        ? 'bg-inverse-surface text-inverse-on-surface font-semibold'
                        : 'bg-surface-container text-on-surface hover:bg-secondary-container'
                    }`}
                  >
                    Requester
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('TECHNICIAN')}
                    className={`role-pill py-2 px-2 text-center font-title-sm text-title-sm transition-colors text-xs border border-outline-variant cursor-pointer ${
                      role === 'TECHNICIAN'
                        ? 'bg-inverse-surface text-inverse-on-surface font-semibold'
                        : 'bg-surface-container text-on-surface hover:bg-secondary-container'
                    }`}
                  >
                    Technician
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('DEPARTMENT_HEAD')}
                    className={`role-pill py-2 px-2 text-center font-title-sm text-title-sm transition-colors text-xs border border-outline-variant cursor-pointer ${
                      role === 'DEPARTMENT_HEAD'
                        ? 'bg-inverse-surface text-inverse-on-surface font-semibold'
                        : 'bg-surface-container text-on-surface hover:bg-secondary-container'
                    }`}
                  >
                    Dept Head
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`role-pill py-2 px-2 text-center font-title-sm text-title-sm transition-colors text-xs border border-outline-variant cursor-pointer ${
                      role === 'ADMIN'
                        ? 'bg-inverse-surface text-inverse-on-surface font-semibold'
                        : 'bg-surface-container text-on-surface hover:bg-secondary-container'
                    }`}
                  >
                    Admin
                  </button>
                </div>
                <p className="font-label-code text-label-code text-secondary text-[11px] mt-0.5">
                  {roleHints[role] || roleHints.STUDENT}
                </p>
              </div>

              {/* Registration Exclusive Field: Full Legal Name */}
              {isRegister && (
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider"
                    htmlFor="full-name"
                  >
                    Full Legal Name (Institutional Record)
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Aarav Sharma / Maya Sen"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 font-body-md text-body-md text-on-surface border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest focus:border-on-surface"
                  />
                </div>
              )}

              {/* Identifier / Roll No Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider"
                    htmlFor="campus-id"
                  >
                    University ID / Institutional Email
                  </label>
                  <span className="font-label-code text-label-code text-secondary text-[11px]">
                    Format: id@unipulse.edu
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-secondary material-symbols-outlined text-lg">badge</span>
                  <input
                    id="campus-id"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student.alex@unipulse.edu"
                    className="w-full bg-surface-container-low pl-10 pr-3.5 py-2.5 font-label-code text-label-code text-on-surface border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest focus:border-on-surface"
                  />
                </div>
                <span className="font-label-caption text-label-caption text-secondary text-[11px]">
                  Valid formats: student.alex@unipulse.edu, admin@unipulse.edu, tech.marcus@unipulse.edu
                </span>
              </div>

              {/* Password Field with Archival Toggle */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider"
                    htmlFor="auth-token"
                  >
                    Passphrase / LDAP Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('password123')}
                    className="font-label-code text-label-code text-primary hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Reset credential?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-secondary material-symbols-outlined text-lg">lock</span>
                  <input
                    id="auth-token"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure passphrase"
                    className="w-full bg-surface-container-low pl-10 pr-10 py-2.5 font-label-code text-label-code text-on-surface border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest focus:border-on-surface"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-secondary hover:text-on-surface flex items-center bg-transparent border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Registration Exclusive Field: Department Affiliation */}
              {isRegister && (
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider"
                    htmlFor="dept-select"
                  >
                    Assigned Department / Resident Quad
                  </label>
                  <select
                    id="dept-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-surface-container-low px-3.5 py-2.5 font-body-md text-body-md text-on-surface border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest focus:border-on-surface"
                  >
                    <option value="Facilities & Maintenance">Facilities &amp; Maintenance (Civil &amp; Buildings)</option>
                    <option value="IT & Network Infrastructure">IT &amp; Network Infrastructure (Wi-Fi, Systems)</option>
                    <option value="Residential & Housing">Residential &amp; Housing (Dorms &amp; Quads)</option>
                    <option value="Campus Safety & Security">Campus Safety &amp; Security (Access &amp; CCTV)</option>
                  </select>
                </div>
              )}

              {/* Validation / Error Banner */}
              {error && (
                <div className="bg-error-container p-3 text-on-error-container flex items-start gap-2.5 border border-error/30">
                  <span className="material-symbols-outlined text-base mt-0.5 text-error">report_problem</span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm font-semibold text-error">
                      Authentication Challenge
                    </span>
                    <span className="font-body-sm text-body-sm text-on-error-container">{error}</span>
                  </div>
                </div>
              )}

              {/* Checkbox & Security Confirmation */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    className="w-4 h-4 text-primary accent-primary bg-surface-container-low rounded-none border border-outline"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface">
                    Remember this terminal for 14 days
                  </span>
                </label>
              </div>

              {/* Primary Action Trigger */}
              <button
                id="submit-button"
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-4 font-title-sm text-title-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-none cursor-pointer font-semibold"
              >
                <span>{loading ? 'Authorizing Session...' : isRegister ? 'Register Identity' : 'Authorize & Access UniPulse'}</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>

            {/* Quick Fast-Lane Demo Roles Strip */}
            <div className="pt-4 border-t border-dashed border-outline-variant flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                  Quick Access Profiles (Pre-Seeded)
                </span>
                <span className="font-label-code text-[10px] text-tertiary font-semibold">
                  PASS: password123
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetLogin('STUDENT', 'student.alex@unipulse.edu')}
                  className="p-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-left transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-title-sm text-[12px] font-semibold text-on-surface">Alex Rivera</span>
                  <span className="font-label-code text-[10px] text-secondary">Student / Req</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetLogin('TECHNICIAN', 'tech.marcus@unipulse.edu')}
                  className="p-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-left transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-title-sm text-[12px] font-semibold text-on-surface">Marcus Vance</span>
                  <span className="font-label-code text-[10px] text-secondary">Technician</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetLogin('DEPARTMENT_HEAD', 'faculty.wright@unipulse.edu')}
                  className="p-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-left transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-title-sm text-[12px] font-semibold text-on-surface">Prof. Wright</span>
                  <span className="font-label-code text-[10px] text-secondary">Dept Head</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetLogin('ADMIN', 'admin@unipulse.edu')}
                  className="p-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-left transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-title-sm text-[12px] font-semibold text-on-surface">Sys Admin</span>
                  <span className="font-label-code text-[10px] text-secondary">Platform Admin</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
