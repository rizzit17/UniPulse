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
      <div className="w-full py-24 text-center font-body-md text-secondary bg-surface">
        Loading analytics...
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
      <div className="w-full bg-surface-container-low border-b border-outline-variant py-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-normal">
              Operations Analytics
            </h1>
            <p className="font-body-md text-body-md text-secondary m-0 mt-1">
              Overview of campus maintenance requests, resolution trends, and technician workloads.
            </p>
          </div>
          <span className="font-label-code text-label-code text-secondary bg-surface px-3 py-1.5 border border-outline-variant">
            Window: <span className="text-on-surface font-semibold">Last 30 Days</span>
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 flex flex-col gap-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 border border-outline-variant">
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block">
              Total Requests
            </span>
            <div className="font-headline-lg text-[32px] text-on-surface font-semibold mt-1">
              {overview?.totalCreated ?? 0}
            </div>
            <span className="text-xs text-secondary mt-1 block">
              Across all campus facilities
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 border border-outline-variant">
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block">
              Resolved Tickets
            </span>
            <div className="font-headline-lg text-[32px] text-tertiary font-semibold mt-1">
              {overview?.totalResolved ?? 0}
            </div>
            <span className="text-xs text-secondary mt-1 block">
              Avg resolve: {overview?.avgResolveMinutes ?? 0} mins
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 border border-outline-variant">
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block">
              SLA Compliance
            </span>
            <div className="font-headline-lg text-[32px] text-primary font-semibold mt-1">
              {overview?.slaComplianceRate ?? 100}%
            </div>
            <span className="text-xs text-secondary mt-1 block">
              {overview?.totalBreached ?? 0} tickets breached target
            </span>
          </div>

          <div className="bg-surface-container-lowest p-5 border border-outline-variant">
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider block">
              Active Hotspots
            </span>
            <div className="font-headline-lg text-[32px] text-error font-semibold mt-1">
              {overview?.activeHotspotsCount ?? 0}
            </div>
            <span className="text-xs text-secondary mt-1 block">
              Zones with repeat complaints
            </span>
          </div>
        </div>

        {/* Chart: Daily Volume */}
        <div className="bg-surface-container-lowest p-6 border border-outline-variant flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant">
            <div>
              <h2 className="font-title-lg text-title-lg text-on-surface m-0 font-medium">
                Daily Request &amp; Resolution Trends
              </h2>
              <p className="text-xs text-secondary m-0 mt-0.5">
                New tickets filed versus tickets resolved over time
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="w-2.5 h-2.5 bg-primary inline-block"></span>
                Created
              </span>
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="w-2.5 h-2.5 bg-tertiary inline-block"></span>
                Resolved
              </span>
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="w-2.5 h-2.5 bg-error inline-block"></span>
                Breached
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
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
                <Bar dataKey="created" fill="#9f3c16" name="Created" radius={[2, 2, 0, 0]} />
                <Bar dataKey="resolved" fill="#2a674c" name="Resolved" radius={[2, 2, 0, 0]} />
                <Bar dataKey="breached" fill="#ba1a1a" name="Breached" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workload & Hotspots */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workload */}
          <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant flex flex-col">
            <div className="p-4 border-b border-outline-variant">
              <h2 className="font-title-lg text-title-lg text-on-surface m-0 font-medium">
                Technician Workload
              </h2>
              <p className="text-xs text-secondary m-0 mt-0.5">
                Current ticket distribution across maintenance specialists
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-secondary font-semibold uppercase">
                    <th className="p-3">Specialist</th>
                    <th className="p-3 text-center">Assigned</th>
                    <th className="p-3 text-center">Resolved</th>
                    <th className="p-3 text-right">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {workload.map((w, idx) => (
                    <tr key={w.technicianId || idx} className="hover:bg-surface-container-low">
                      <td className="p-3 text-on-surface font-medium">
                        {w.technicianName || `Technician ${idx + 1}`}
                      </td>
                      <td className="p-3 text-center font-label-code text-primary font-bold">
                        {w.assignedCount}
                      </td>
                      <td className="p-3 text-center font-label-code text-tertiary font-bold">
                        {w.resolvedCount}
                      </td>
                      <td className="p-3 text-right font-label-code text-secondary">
                        {w.avgResolveMinutes}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hotspots */}
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant flex flex-col">
            <div className="p-4 border-b border-outline-variant">
              <h2 className="font-title-lg text-title-lg text-on-surface m-0 font-medium">
                Recurring Hotspots
              </h2>
              <p className="text-xs text-secondary m-0 mt-0.5">
                Locations with highest reported incident frequency
              </p>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {hotspots.length === 0 ? (
                <div className="text-secondary py-8 text-center text-xs">
                  No active hotspots detected.
                </div>
              ) : (
                hotspots.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-container-low border border-outline-variant flex items-center justify-between"
                  >
                    <div>
                      <div className="font-title-sm text-title-sm text-on-surface font-medium">
                        Block {h.locationBlock} — Room {h.locationRoom}
                      </div>
                      <div className="text-xs text-secondary mt-0.5">
                        Category: {h.categoryId ? `Trade #${h.categoryId.substring(0, 6)}` : 'General Facility'}
                      </div>
                    </div>
                    <span className="font-label-code text-xs px-2 py-0.5 bg-surface-container-highest text-error font-bold border border-outline-variant">
                      {h.count30d} reports
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
