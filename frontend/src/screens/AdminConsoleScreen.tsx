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
    { id: 'd-1', name: 'Electrical & Power', code: 'ELEC', headUserName: 'Priya Sharma' },
    { id: 'd-2', name: 'Civil & Plumbing', code: 'CIVIL', headUserName: 'Karan Mehra' },
    { id: 'd-3', name: 'HVAC & Climate', code: 'HVAC', headUserName: 'Ananya Roy' },
    { id: 'd-4', name: 'IT & Networking', code: 'NET', headUserName: 'Sanjay Joshi' },
  ];

  const demoCategories: Category[] = [
    { id: 'c-1', departmentId: 'd-1', name: 'Electrical Short / Sparking', code: 'POW_SPARK', defaultPriority: 'P1' },
    { id: 'c-2', departmentId: 'd-1', name: 'Lighting Failure', code: 'LGT_FAIL', defaultPriority: 'P3' },
    { id: 'c-3', departmentId: 'd-2', name: 'Water Pipe Leak', code: 'PLM_LEAK', defaultPriority: 'P2' },
    { id: 'c-4', departmentId: 'd-3', name: 'Air Conditioner Malfunction', code: 'AC_FAIL', defaultPriority: 'P2' },
    { id: 'c-5', departmentId: 'd-4', name: 'Wi-Fi Offline', code: 'NET_WIFI', defaultPriority: 'P3' },
  ];

  const demoSlaPolicies: SlaPolicy[] = [
    { id: 'sla-1', priority: 'P1', responseTargetMinutes: 15, resolutionTargetMinutes: 120 },
    { id: 'sla-2', priority: 'P2', responseTargetMinutes: 30, resolutionTargetMinutes: 240 },
    { id: 'sla-3', priority: 'P3', responseTargetMinutes: 120, resolutionTargetMinutes: 1440 },
    { id: 'sla-4', priority: 'P4', responseTargetMinutes: 240, resolutionTargetMinutes: 2880 },
  ];

  const demoAuditLogs = [
    { at: '10:14 AM', actor: 'Priya Sharma', action: 'Assigned ticket UP-2026-000102 to Vikram Singh', target: 'UP-2026-000102' },
    { at: '09:42 AM', actor: 'System Auto-Assign', action: 'Matched technician Ramesh Kumar for HVAC incident', target: 'UP-2026-000101' },
    { at: '08:30 AM', actor: 'SLA Watcher', action: 'Sent 30-minute reminder notification', target: 'UP-2026-000103' },
  ];

  const tabs = [
    { key: 'users', label: 'Users' },
    { key: 'depts', label: 'Departments' },
    { key: 'categories', label: 'Categories' },
    { key: 'sla', label: 'SLA Policies' },
    { key: 'audit', label: 'Audit Log' },
  ] as const;

  return (
    <div className="w-full bg-surface text-on-surface">
      {/* Masthead */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant py-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-normal">
              Admin Console
            </h1>
            <p className="font-body-md text-body-md text-secondary m-0 mt-1">
              Manage user roles, facilities departments, service categories, and SLA thresholds.
            </p>
          </div>
          <span className="font-label-code text-label-code text-on-surface bg-surface px-3 py-1.5 border border-outline-variant font-medium">
            Role: <span className="text-primary font-semibold">Admin</span>
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-surface-container-low p-1 border border-outline-variant max-w-fit">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-semibold transition-colors border-none cursor-pointer ${
                  active
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-secondary hover:text-on-surface bg-transparent'
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
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-secondary font-semibold uppercase">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low">
                    <td className="p-3 font-title-sm text-title-sm text-on-surface font-medium">{u.name}</td>
                    <td className="p-3 text-secondary">{u.email}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 bg-surface text-primary border border-outline-variant font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-secondary">{u.dept}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => alert(`Edit role for ${u.name}`)}
                        className="px-2.5 py-1 bg-surface hover:bg-surface-container text-on-surface border border-outline-variant text-xs font-semibold cursor-pointer"
                      >
                        Edit
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
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-secondary font-semibold uppercase">
                  <th className="p-3">Code</th>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Head of Department</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoDepts.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-container-low">
                    <td className="p-3 font-label-code font-bold text-primary">{d.code}</td>
                    <td className="p-3 font-title-sm text-title-sm text-on-surface font-medium">{d.name}</td>
                    <td className="p-3 text-secondary">{d.headUserName}</td>
                    <td className="p-3 text-right">
                      <span className="text-xs text-tertiary font-semibold">Active</span>
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
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-secondary font-semibold uppercase">
                  <th className="p-3">Code</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Default Priority</th>
                  <th className="p-3 text-right">Dispatch Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low">
                    <td className="p-3 font-label-code text-xs text-secondary">{c.code}</td>
                    <td className="p-3 font-title-sm text-title-sm text-on-surface font-medium">{c.name}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 bg-surface text-primary border border-outline-variant font-bold">
                        {c.defaultPriority}
                      </span>
                    </td>
                    <td className="p-3 text-right text-xs text-tertiary font-medium">
                      Auto Dispatch
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
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-secondary font-semibold uppercase">
                  <th className="p-3">Priority</th>
                  <th className="p-3">Response Target</th>
                  <th className="p-3">Resolution Target</th>
                  <th className="p-3 text-right">Escalation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoSlaPolicies.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low">
                    <td className="p-3 font-bold text-primary">[{s.priority}]</td>
                    <td className="p-3 text-secondary">{s.responseTargetMinutes} mins</td>
                    <td className="p-3 text-on-surface font-medium">{s.resolutionTargetMinutes / 60} hours</td>
                    <td className="p-3 text-right text-xs text-secondary">
                      Notify Dept Head
                    </td>
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
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-secondary font-semibold uppercase">
                  <th className="p-3 w-28">Time</th>
                  <th className="p-3 w-48">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3 w-36 text-right">Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoAuditLogs.map((l, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low">
                    <td className="p-3 text-xs text-secondary">{l.at}</td>
                    <td className="p-3 font-title-sm text-title-sm text-on-surface font-medium">{l.actor}</td>
                    <td className="p-3 text-on-surface">{l.action}</td>
                    <td className="p-3 text-right font-label-code text-xs font-bold text-primary">
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
