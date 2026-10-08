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

  const tabs = [
    { key: 'users', label: 'USERS & ROLES' },
    { key: 'depts', label: 'DEPARTMENTS' },
    { key: 'categories', label: 'CATEGORIES & ROUTING' },
    { key: 'sla', label: 'SLA POLICIES' },
    { key: 'audit', label: 'AUDIT TRAIL' },
  ] as const;

  return (
    <div className="w-full bg-surface text-on-surface">
      {/* Masthead */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant py-space-md px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm">
          <div>
            <div className="flex items-center gap-space-xs font-label-stamp text-label-stamp text-secondary uppercase tracking-widest mb-1">
              <span>ADMINISTRATIVE REGISTRY</span>
              <span>·</span>
              <span className="text-primary font-semibold">SEC-05 GOVERNANCE</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 leading-tight">
              Administrative Control Console
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant m-0 mt-1">
              Platform governance for user roles, department taxonomy, dispatch routing rules, and SLA threshold policies.
            </p>
          </div>
          <div className="font-label-code text-label-code text-secondary bg-surface px-3 py-1.5 border border-outline-variant">
            ACCESS LEVEL: <span className="text-primary font-bold">SUPER-ADMIN</span>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 py-space-xl flex flex-col gap-space-lg">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-outline-variant bg-surface-container-low">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 font-label-stamp text-label-stamp uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                  active
                    ? 'bg-surface-container-highest text-on-surface font-bold border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high bg-transparent border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'users' && (
          <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-code text-label-code text-secondary">
                  <th className="p-3">NAME</th>
                  <th className="p-3">EMAIL</th>
                  <th className="p-3">ROLE</th>
                  <th className="p-3">TRADE DEPT</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low">
                    <td className="p-3 font-title-sm text-title-sm text-on-surface">{u.name}</td>
                    <td className="p-3 font-label-code text-label-code text-secondary">{u.email}</td>
                    <td className="p-3">
                      <span className="font-label-stamp text-label-stamp px-1.5 py-0.5 bg-surface text-primary border border-outline-variant">
                        [{u.role}]
                      </span>
                    </td>
                    <td className="p-3 text-secondary">{u.dept}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => alert(`Modify permissions for ${u.name}`)}
                        className="px-2.5 py-1 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-title-sm text-xs cursor-pointer"
                      >
                        EDIT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'depts' && (
          <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-code text-label-code text-secondary">
                  <th className="p-3">CODE</th>
                  <th className="p-3">DEPARTMENT NAME</th>
                  <th className="p-3">HEAD OF DEPARTMENT</th>
                  <th className="p-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoDepts.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-container-low">
                    <td className="p-3 font-label-code text-label-code font-bold text-primary">{d.code}</td>
                    <td className="p-3 font-title-sm text-title-sm text-on-surface">{d.name}</td>
                    <td className="p-3 text-secondary">{d.headUserName}</td>
                    <td className="p-3 text-right">
                      <span className="font-label-stamp text-label-stamp text-tertiary">[ACTIVE]</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-code text-label-code text-secondary">
                  <th className="p-3">CODE</th>
                  <th className="p-3">CATEGORY SPECIFICATION</th>
                  <th className="p-3">BASE PRIORITY</th>
                  <th className="p-3 text-right">ROUTING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low">
                    <td className="p-3 font-label-code text-label-code text-secondary">{c.code}</td>
                    <td className="p-3 font-title-sm text-title-sm text-on-surface">{c.name}</td>
                    <td className="p-3">
                      <span className="font-label-stamp text-label-stamp px-1.5 py-0.5 bg-surface text-primary border border-outline-variant">
                        [{c.defaultPriority}]
                      </span>
                    </td>
                    <td className="p-3 text-right font-label-code text-label-code text-tertiary">
                      AUTO-DISPATCH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sla' && (
          <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-code text-label-code text-secondary">
                  <th className="p-3">PRIORITY</th>
                  <th className="p-3">INITIAL RESPONSE TARGET</th>
                  <th className="p-3">MAX RESOLUTION TARGET</th>
                  <th className="p-3 text-right">BREACH ESCALATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoSlaPolicies.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low">
                    <td className="p-3 font-label-stamp text-label-stamp font-bold text-primary">[{s.priority}]</td>
                    <td className="p-3 font-label-code text-label-code">{s.responseTargetMinutes} minutes</td>
                    <td className="p-3 font-label-code text-label-code">{s.resolutionTargetMinutes / 60} hours</td>
                    <td className="p-3 text-right font-label-code text-label-code text-error">HOD PUSH NOTIFY</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-code text-label-code text-secondary">
                  <th className="p-3 w-28">TIMESTAMP</th>
                  <th className="p-3 w-48">ACTOR</th>
                  <th className="p-3">ACTION EVENT</th>
                  <th className="p-3 w-36 text-right">TARGET DOCKET</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoAuditLogs.map((l, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low">
                    <td className="p-3 font-label-code text-label-code text-secondary">{l.at}</td>
                    <td className="p-3 font-title-sm text-title-sm text-on-surface">{l.actor}</td>
                    <td className="p-3 text-on-surface">{l.action}</td>
                    <td className="p-3 text-right font-label-code text-label-code font-bold text-primary">
                      {l.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsoleScreen;
