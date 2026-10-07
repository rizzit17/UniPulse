import React, { useState } from 'react';
import { Department, Category, SlaPolicy } from '../types/api';

export const AdminConsoleScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'depts' | 'categories' | 'sla' | 'audit'>('users');

  const demoUsers = [
    { id: 'u-1', name: 'Aarav Patel', email: 'aarav.student@unipulse.edu', role: 'STUDENT', dept: '—' },
    { id: 'u-2', name: 'Ramesh Kumar', email: 'ramesh.tech@unipulse.edu', role: 'TECHNICIAN', dept: 'HVAC' },
    { id: 'u-3', name: 'Vikram Singh', email: 'vikram.tech@unipulse.edu', role: 'TECHNICIAN', dept: 'Electrical' },
    { id: 'u-4', name: 'Priya Sharma', email: 'priya.head@unipulse.edu', role: 'DEPARTMENT_HEAD', dept: 'Electrical' },
    { id: 'u-5', name: 'Deepak Rao', email: 'deepak.admin@unipulse.edu', role: 'ADMIN', dept: 'Operations' },
  ];

  const demoDepts: Department[] = [
    { id: 'd-1', name: 'Electrical & Power Infrastructure', code: 'ELEC', headUserName: 'Priya Sharma' },
    { id: 'd-2', name: 'Civil Infrastructure & Plumbing', code: 'CIVIL', headUserName: 'Karan Mehra' },
    { id: 'd-3', name: 'HVAC & Climate Control', code: 'HVAC', headUserName: 'Ananya Roy' },
    { id: 'd-4', name: 'Campus IT & Telecommunications', code: 'NET', headUserName: 'Sanjay Joshi' },
  ];

  const demoCategories: Category[] = [
    { id: 'c-1', departmentId: 'd-1', name: 'Power Socket Sparking / Short', code: 'POW_SPARK', defaultPriority: 'P1' },
    { id: 'c-2', departmentId: 'd-1', name: 'Corridor Lighting Outage', code: 'LGT_FAIL', defaultPriority: 'P3' },
    { id: 'c-3', departmentId: 'd-2', name: 'Water Pipe Rupture / Leak', code: 'PLM_LEAK', defaultPriority: 'P2' },
    { id: 'c-4', departmentId: 'd-3', name: 'Classroom AC Cooling Failure', code: 'AC_FAIL', defaultPriority: 'P2' },
    { id: 'c-5', departmentId: 'd-4', name: 'Wi-Fi Access Point Offline', code: 'NET_WIFI', defaultPriority: 'P3' },
  ];

  const demoSlaPolicies: SlaPolicy[] = [
    { id: 'sla-1', priority: 'P1', responseTargetMinutes: 15, resolutionTargetMinutes: 120 },
    { id: 'sla-2', priority: 'P2', responseTargetMinutes: 30, resolutionTargetMinutes: 240 },
    { id: 'sla-3', priority: 'P3', responseTargetMinutes: 120, resolutionTargetMinutes: 1440 },
    { id: 'sla-4', priority: 'P4', responseTargetMinutes: 240, resolutionTargetMinutes: 2880 },
  ];

  const demoAuditLogs = [
    { at: '10:14:02', actor: 'Priya Sharma (HEAD)', action: 'Reassigned UP-2026-000102 to Vikram Singh', target: 'UP-2026-000102' },
    { at: '09:42:15', actor: 'System Auto-Assign', action: 'Matched LeastLoaded tech Ramesh Kumar for HVAC', target: 'UP-2026-000101' },
    { at: '08:30:00', actor: 'SLA Watcher Daemon', action: 'Issued SLA Warning (30 min remaining)', target: 'UP-2026-000103' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', color: 'var(--ink)', marginBottom: '6px' }}>
          ADMINISTRATIVE CONTROL CONSOLE
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>
          Platform governance for identity access, department routing rules, and SLA threshold policies.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: 'var(--bw) solid var(--ink)',
          marginBottom: '24px',
        }}
      >
        {[
          { key: 'users', label: 'USERS & ROLES' },
          { key: 'depts', label: 'DEPARTMENTS' },
          { key: 'categories', label: 'CATEGORIES & ROUTING' },
          { key: 'sla', label: 'SLA POLICIES' },
          { key: 'audit', label: 'AUDIT TRAIL' },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as unknown as typeof activeTab)}
              style={{
                padding: '10px 18px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: active ? 'var(--ink)' : 'var(--paper-2)',
                color: active ? 'var(--paper)' : 'var(--ink)',
                border: 'var(--bw) solid var(--ink)',
                borderBottom: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'users' && (
        <div style={{ border: 'var(--bw) solid var(--ink)', boxShadow: 'var(--sh-md)' }}>
          <table className="brutalist-table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>DEPARTMENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {demoUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className="mono">{u.email}</td>
                  <td>
                    <span className="stamp-chip" style={{ backgroundColor: 'var(--card)' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.dept}</td>
                  <td>
                    <button className="btn-brutalist btn-secondary" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      EDIT ROLE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'depts' && (
        <div style={{ border: 'var(--bw) solid var(--ink)', boxShadow: 'var(--sh-md)' }}>
          <table className="brutalist-table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>CODE</th>
                <th>DEPARTMENT NAME</th>
                <th>HEAD OF DEPARTMENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {demoDepts.map((d) => (
                <tr key={d.id}>
                  <td className="mono" style={{ fontWeight: 700 }}>{d.code}</td>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>{d.headUserName}</td>
                  <td>
                    <button className="btn-brutalist btn-secondary" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      MANAGE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'categories' && (
        <div style={{ border: 'var(--bw) solid var(--ink)', boxShadow: 'var(--sh-md)' }}>
          <table className="brutalist-table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>CODE</th>
                <th>CATEGORY NAME</th>
                <th>DEFAULT PRIORITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {demoCategories.map((c) => (
                <tr key={c.id}>
                  <td className="mono" style={{ fontWeight: 700 }}>{c.code}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    <span className="stamp-chip" style={{ backgroundColor: 'var(--card)' }}>
                      {c.defaultPriority}
                    </span>
                  </td>
                  <td>
                    <button className="btn-brutalist btn-secondary" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      EDIT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sla' && (
        <div style={{ border: 'var(--bw) solid var(--ink)', boxShadow: 'var(--sh-md)' }}>
          <table className="brutalist-table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>PRIORITY</th>
                <th>FIRST RESPONSE TARGET</th>
                <th>RESOLUTION TARGET</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {demoSlaPolicies.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="stamp-chip" style={{ backgroundColor: 'var(--card)' }}>
                      {p.priority}
                    </span>
                  </td>
                  <td className="mono">{p.responseTargetMinutes} minutes</td>
                  <td className="mono">{p.resolutionTargetMinutes} minutes ({(p.resolutionTargetMinutes / 60).toFixed(1)} hrs)</td>
                  <td>
                    <button className="btn-brutalist btn-secondary" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      CONFIG
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{ border: 'var(--bw) solid var(--ink)', boxShadow: 'var(--sh-md)' }}>
          <table className="brutalist-table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTOR</th>
                <th>ACTION SUMMARY</th>
                <th>TARGET ID</th>
              </tr>
            </thead>
            <tbody>
              {demoAuditLogs.map((log, idx) => (
                <tr key={idx}>
                  <td className="mono">{log.at}</td>
                  <td style={{ fontWeight: 600 }}>{log.actor}</td>
                  <td>{log.action}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{log.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
