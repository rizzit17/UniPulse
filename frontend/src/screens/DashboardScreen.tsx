import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { HotspotDto, OverviewStatsResponse, TechnicianWorkloadDto } from '../types/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DashboardScreen: React.FC = () => {
  const [overview, setOverview] = useState<OverviewStatsResponse | null>(null);
  const [hotspots, setHotspots] = useState<HotspotDto[]>([]);
  const [workload, setWorkload] = useState<TechnicianWorkloadDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getHotspots(5),
      api.getWorkload(),
    ])
      .then(([ov, hs, wl]) => {
        setOverview(ov);
        setHotspots(hs);
        setWorkload(wl);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full py-24 text-center font-label-code text-label-code text-secondary bg-surface">
        LOADING TELEMETRY MATRICES...
      </div>
    );
  }

  const chartData = overview?.dailyTrend.map((t) => ({
    name: t.date.substring(5), // MM-DD
    created: t.created,
    resolved: t.resolved,
    breached: t.breached,
  })) || [];

  return (
    <div className="w-full bg-surface text-on-surface">
      {/* Masthead */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant py-space-md px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm">
          <div>
            <div className="flex items-center gap-space-xs font-label-stamp text-label-stamp text-secondary uppercase tracking-widest mb-1">
              <span>ANALYTICS &amp; TELEMETRY</span>
              <span>·</span>
              <span className="text-primary font-semibold">SEC-04 OPERATIONS</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 leading-tight">
              Operational Dispatch Dashboard
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant m-0 mt-1">
              Pre-aggregated operational intelligence across trade queues, specialist loads, and recurring campus hotspots.
            </p>
          </div>
          <div className="font-label-code text-label-code text-secondary bg-surface px-3 py-1.5 border border-outline-variant">
            REPORTING WINDOW: <span className="text-primary font-bold">PAST 30 DAYS</span>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 py-space-xl flex flex-col gap-space-xl">
        {/* 01 Metrics Strip */}
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant">
            <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
              01 // Campus Operations Pulse
            </span>
            <span className="font-label-code text-label-code text-secondary">METRIC REGISTER</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="bg-surface-container-lowest p-space-md border border-outline-variant">
              <span className="font-label-caption text-label-caption text-secondary uppercase block">
                Total Dockets Logged
              </span>
              <span className="font-label-code text-[36px] font-bold text-on-surface leading-tight mt-1 block">
                {overview?.totalCreated ?? 0}
              </span>
              <span className="font-label-caption text-label-caption text-secondary mt-1 block">
                Across all 4 faculties
              </span>
            </div>

            <div className="bg-surface-container-lowest p-space-md border border-outline-variant">
              <span className="font-label-caption text-label-caption text-secondary uppercase block">
                Resolved Completed
              </span>
              <span className="font-label-code text-[36px] font-bold text-tertiary leading-tight mt-1 block">
                {overview?.totalResolved ?? 0}
              </span>
              <span className="font-label-caption text-label-caption text-secondary mt-1 block">
                Avg resolve: {overview?.avgResolveMinutes ?? 0}m
              </span>
            </div>

            <div className="bg-surface-container-lowest p-space-md border border-outline-variant">
              <span className="font-label-caption text-label-caption text-secondary uppercase block">
                SLA Compliance Rate
              </span>
              <span className="font-label-code text-[36px] font-bold text-primary leading-tight mt-1 block">
                {overview?.slaComplianceRate ?? 100}%
              </span>
              <span className="font-label-caption text-label-caption text-secondary mt-1 block">
                {overview?.totalBreached ?? 0} dockets breached
              </span>
            </div>

            <div className="bg-surface-container-lowest p-space-md border border-outline-variant">
              <span className="font-label-caption text-label-caption text-secondary uppercase block">
                Recurring Hotspots
              </span>
              <span className="font-label-code text-[36px] font-bold text-error leading-tight mt-1 block">
                {overview?.activeHotspotsCount ?? 0}
              </span>
              <span className="font-label-caption text-label-caption text-secondary mt-1 block">
                Zones with &gt;5 incidents
              </span>
            </div>
          </div>
        </div>

        {/* 02 Charts: Daily Ingestion & Throughput */}
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant">
            <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
              02 // Daily Ingestion &amp; Resolution Trajectory
            </span>
            <span className="font-label-code text-label-code text-secondary">30-DAY TIMELINE</span>
          </div>

          <div className="bg-surface-container-lowest p-space-lg border border-outline-variant">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#8a726a"
                    tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#8a726a"
                    tick={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fbf9f5',
                      border: '1px solid #dec0b7',
                      borderRadius: 0,
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="created" fill="#9f3c16" name="Created" />
                  <Bar dataKey="resolved" fill="#2a674c" name="Resolved" />
                  <Bar dataKey="breached" fill="#ba1a1a" name="Breached" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-space-lg justify-center mt-space-md font-label-code text-label-code">
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="w-3 h-3 bg-primary inline-block"></span>
                CREATED
              </span>
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="w-3 h-3 bg-tertiary inline-block"></span>
                RESOLVED
              </span>
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="w-3 h-3 bg-error inline-block"></span>
                BREACHED
              </span>
            </div>
          </div>
        </div>

        {/* 03 & 04: Workload & Hotspots Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
          {/* Workload */}
          <div className="lg:col-span-7 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant">
              <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
                03 // Specialist Workload Manifest
              </span>
              <span className="font-label-code text-label-code text-secondary">ACTIVE TRADE POOL</span>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
              <table className="w-full text-left border-collapse font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant font-label-code text-label-code text-secondary">
                    <th className="p-3">SPECIALIST</th>
                    <th className="p-3 text-center">ASSIGNED</th>
                    <th className="p-3 text-center">RESOLVED</th>
                    <th className="p-3 text-right">AVG TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {workload.map((w, idx) => (
                    <tr key={w.technicianId || idx} className="hover:bg-surface-container-low">
                      <td className="p-3 font-title-sm text-title-sm text-on-surface">
                        {w.technicianName || `Technician ${idx + 1}`}
                      </td>
                      <td className="p-3 text-center font-label-code text-label-code font-bold text-primary">
                        {w.assignedCount}
                      </td>
                      <td className="p-3 text-center font-label-code text-label-code text-tertiary font-bold">
                        {w.resolvedCount}
                      </td>
                      <td className="p-3 text-right font-label-code text-label-code text-secondary">
                        {w.avgResolveMinutes}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hotspots */}
          <div className="lg:col-span-5 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant">
              <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
                04 // Critical Campus Hotspots
              </span>
              <span className="font-label-code text-label-code text-secondary">PRIORITY AUDIT</span>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant p-space-md flex flex-col gap-space-sm">
              {hotspots.length === 0 ? (
                <div className="font-label-code text-label-code text-secondary py-8 text-center">
                  No active hotspots flagged.
                </div>
              ) : (
                hotspots.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-space-sm bg-surface-container-low border border-outline-variant flex items-center justify-between"
                  >
                    <div>
                      <div className="font-title-sm text-title-sm text-on-surface">
                        {h.locationBlock} — Room {h.locationRoom}
                      </div>
                      <div className="font-label-caption text-label-caption text-secondary">
                        Zone Category: {h.categoryId ? `Trade #${h.categoryId.substring(0, 6)}` : 'HVAC / Electrical'}
                      </div>
                    </div>
                    <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-error text-on-error font-bold">
                      {h.count30d} INCIDENTS
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
