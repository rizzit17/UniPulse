import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { HotspotDto, OverviewStatsResponse, TechnicianWorkloadDto } from '../types/api';
import { StatBlock } from '../components/StatBlock';
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
      <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        Loading dashboard metrics...
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
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', color: 'var(--ink)', marginBottom: '6px' }}>
          OPERATIONAL DISPATCH DASHBOARD
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>
          Pre-aggregated operational intelligence across department queues, technician workloads, and recurring infrastructure hotspots.
        </p>
      </div>

      {/* 01 STAT BLOCKS */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              fontWeight: 900,
              color: 'transparent',
              WebkitTextStroke: '2px var(--ink)',
              lineHeight: 1,
            }}
          >
            01
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
            OPERATIONAL PULSE (PAST 30 DAYS)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <StatBlock
            label="TOTAL TICKETS LOGGED"
            value={overview?.totalCreated ?? 0}
            topBorderColor="var(--steel)"
            subtext="Across all 4 faculties"
          />
          <StatBlock
            label="RESOLVED COMPLETED"
            value={overview?.totalResolved ?? 0}
            topBorderColor="var(--moss)"
            subtext={`Avg resolve: ${overview?.avgResolveMinutes ?? 0}m`}
          />
          <StatBlock
            label="SLA COMPLIANCE RATE"
            value={`${overview?.slaComplianceRate ?? 100}%`}
            topBorderColor="var(--amber)"
            subtext={`${overview?.totalBreached ?? 0} tickets breached`}
          />
          <StatBlock
            label="REPEAT HOTSPOTS"
            value={overview?.activeHotspotsCount ?? 0}
            topBorderColor="var(--brick)"
            subtext="Locations with >5 complaints"
          />
        </div>
      </div>

      {/* 02 CHARTS: DAILY INGESTION & THROUGHPUT */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              fontWeight: 900,
              color: 'transparent',
              WebkitTextStroke: '2px var(--ink)',
              lineHeight: 1,
            }}
          >
            02
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
            DAILY CREATION & RESOLUTION TRAJECTORY
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--card)',
            border: 'var(--bw) solid var(--ink)',
            boxShadow: 'var(--sh-md)',
            padding: '24px',
          }}
        >
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#16150F"
                  tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                />
                <YAxis
                  stroke="#16150F"
                  tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '2px solid var(--ink)',
                    borderRadius: 0,
                    boxShadow: '2px 2px 0 var(--ink)',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="created" fill="#3E5A73" stroke="#16150F" strokeWidth={2} name="Created" />
                <Bar dataKey="resolved" fill="#5B7A3A" stroke="#16150F" strokeWidth={2} name="Resolved" />
                <Bar dataKey="breached" fill="#B5432B" stroke="#16150F" strokeWidth={2} name="Breached" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: '#3E5A73', border: '1px solid var(--ink)' }}></span>
              CREATED
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: '#5B7A3A', border: '1px solid var(--ink)' }}></span>
              RESOLVED
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: '#B5432B', border: '1px solid var(--ink)' }}></span>
              BREACHED
            </span>
          </div>
        </div>
      </div>

      {/* 03 & 04: WORKLOAD & HOTSPOTS SPLIT */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '28px' }}>
        {/* 03 Workload Table */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '48px',
                fontWeight: 900,
                color: 'transparent',
                WebkitTextStroke: '2px var(--ink)',
                lineHeight: 1,
              }}
            >
              03
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
              TECHNICIAN WORKLOAD
            </span>
          </div>

          <div style={{ border: 'var(--bw) solid var(--ink)', boxShadow: 'var(--sh-md)' }}>
            <table className="brutalist-table" style={{ border: 'none' }}>
              <thead>
                <tr>
                  <th>TECHNICIAN</th>
                  <th>ASSIGNED</th>
                  <th>RESOLVED</th>
                  <th>AVG TIME</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((w, idx) => (
                  <tr key={w.technicianId || idx}>
                    <td style={{ fontWeight: 600 }}>{w.technicianName || `Technician ${idx + 1}`}</td>
                    <td className="mono">{w.assignedCount}</td>
                    <td className="mono">{w.resolvedCount}</td>
                    <td className="mono">{w.avgResolveMinutes}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 04 Hotspots List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '48px',
                fontWeight: 900,
                color: 'transparent',
                WebkitTextStroke: '2px var(--ink)',
                lineHeight: 1,
              }}
            >
              04
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
              RECURRING HOTSPOTS
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--card)',
              border: 'var(--bw) solid var(--ink)',
              boxShadow: 'var(--sh-md)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {hotspots.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--paper-2)',
                    border: 'var(--bw) solid var(--ink)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {h.locationBlock} — {h.locationRoom}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-2)' }}>
                      Last hit: {new Date(h.lastReportedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--brick)',
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--ink)',
                      padding: '2px 8px',
                    }}
                  >
                    {h.count30d}×
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
