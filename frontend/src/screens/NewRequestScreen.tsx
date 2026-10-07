import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Category, CreateRequestDto, Department, RequestPriority, ServiceRequest } from '../types/api';
import { PriorityBadge } from '../components/PriorityBadge';

interface NewRequestScreenProps {
  onSuccess: (created: ServiceRequest) => void;
  onCancel: () => void;
}

export const NewRequestScreen: React.FC<NewRequestScreenProps> = ({ onSuccess, onCancel }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [block, setBlock] = useState<string>('Academic Block B');
  const [room, setRoom] = useState<string>('Room 302');
  const [floor, setFloor] = useState<string>('3rd Floor');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<RequestPriority>('P2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDepartments().then((depts) => {
      setDepartments(depts);
      if (depts.length > 0) {
        setSelectedDeptId(depts[0].id);
      }
    });
    api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCatId(cats[0].id);
        setPriority(cats[0].defaultPriority || 'P2');
      }
    });
  }, []);

  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setPriority(cat.defaultPriority);
    }
  };

  // SLA lookup matrix
  const getSlaTargets = (p: RequestPriority) => {
    switch (p) {
      case 'P1': return { response: '15 min', resolve: '2 hours', note: 'Emergency dispatch' };
      case 'P2': return { response: '30 min', resolve: '4 hours', note: 'High urgency' };
      case 'P3': return { response: '2 hours', resolve: '24 hours', note: 'Standard priority' };
      case 'P4': return { response: '4 hours', resolve: '48 hours', note: 'Low impact maintenance' };
    }
  };

  const slaTargets = getSlaTargets(priority);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 20) {
      setError('Description needs at least 20 characters to assist technicians.');
      return;
    }

    setLoading(true);
    setError(null);

    const dto: CreateRequestDto = {
      categoryId: selectedCatId,
      title,
      description,
      locationBlock: block,
      locationRoom: room,
      locationFloor: floor,
      priority,
    };

    try {
      const created = await api.createRequest(dto);
      onSuccess(created);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', color: 'var(--ink)', marginBottom: '6px' }}>
          RAISE SERVICE REQUEST
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>
          Submit campus maintenance and infrastructure issues directly to operational dispatch.
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#F7E7E2',
            border: 'var(--bw) solid var(--brick)',
            color: 'var(--brick)',
            padding: '14px 18px',
            marginBottom: '24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 600,
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '32px' }}>
        {/* Left: Carbon Copy Form Panel */}
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: 'var(--bw) solid var(--ink)',
            boxShadow: 'var(--sh-md)',
            padding: '32px',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Field 01 */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  borderBottom: '2px solid var(--paper-2)',
                  paddingBottom: '6px',
                  marginBottom: '14px',
                }}
              >
                01. DEPARTMENT & ISSUE CATEGORY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label" htmlFor="dept-select">
                    TARGET DEPARTMENT
                  </label>
                  <select
                    id="dept-select"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="form-select"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="cat-select">
                    ISSUE CATEGORY
                  </label>
                  <select
                    id="cat-select"
                    value={selectedCatId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="form-select"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Field 02 */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  borderBottom: '2px solid var(--paper-2)',
                  paddingBottom: '6px',
                  marginBottom: '14px',
                }}
              >
                02. CAMPUS LOCATION
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" htmlFor="block-input">
                    BLOCK / FACILITY
                  </label>
                  <input
                    id="block-input"
                    type="text"
                    required
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. Academic Block B"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="room-input">
                    ROOM NO.
                  </label>
                  <input
                    id="room-input"
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. 302"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="floor-input">
                    FLOOR
                  </label>
                  <input
                    id="floor-input"
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="3rd Floor"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Field 03 */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  borderBottom: '2px solid var(--paper-2)',
                  paddingBottom: '6px',
                  marginBottom: '14px',
                }}
              >
                03. WHAT IS WRONG?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" htmlFor="title-input">
                    BRIEF SUMMARY
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Split AC leaking water continuously onto workstation"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="desc-textarea">
                    SPECIFIC DETAILS (MIN 20 CHARS)
                  </label>
                  <textarea
                    id="desc-textarea"
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe symptoms, safety hazards, equipment tags, or how long this has been happening..."
                    className="form-textarea"
                  />
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: description.length >= 20 ? 'var(--ink-3)' : 'var(--brick)',
                      marginTop: '4px',
                    }}
                  >
                    {description.length} / 20 characters minimum
                  </div>
                </div>
              </div>
            </div>

            {/* Field 04 */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  borderBottom: '2px solid var(--paper-2)',
                  paddingBottom: '6px',
                  marginBottom: '14px',
                }}
              >
                04. PRIORITY SELECTION
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['P1', 'P2', 'P3', 'P4'] as RequestPriority[]).map((p) => {
                  const active = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        border: 'var(--bw) solid var(--ink)',
                        backgroundColor: active ? 'var(--ink)' : 'var(--paper-2)',
                        color: active ? 'var(--paper)' : 'var(--ink)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onCancel}
                className="btn-brutalist btn-secondary"
                style={{ padding: '12px 20px' }}
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-brutalist btn-primary"
                style={{ padding: '12px 28px' }}
              >
                {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Rail: SLA Matrix & Operational Notices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* SLA Expected Response Card */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: 'var(--bw) solid var(--ink)',
              borderTop: '4px solid var(--amber)',
              boxShadow: 'var(--sh-md)',
              padding: '24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--ink-2)',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              SERVICE LEVEL COMMITMENT
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <PriorityBadge priority={priority} />
                <span style={{ fontSize: '13px', color: 'var(--ink-2)', fontWeight: 500 }}>
                  {slaTargets.note}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: 'var(--paper-2)',
                border: 'var(--bw) solid var(--ink)',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-2)' }}>
                  TARGET FIRST RESPONSE:
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
                  {slaTargets.response}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-2)' }}>
                  MAX RESOLUTION TIME:
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
                  {slaTargets.resolve}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-2)', lineHeight: 1.5 }}>
              Technicians are dispatched automatically based on current workload. If target resolution is breached, tickets escalate to Department Head and Administrative oversight.
            </p>
          </div>

          {/* Operational Policy Box */}
          <div
            style={{
              backgroundColor: 'var(--paper)',
              border: 'var(--bw) solid var(--ink)',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              CAMPUS POLICY NOTICE
            </div>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--ink-2)', lineHeight: 1.6 }}>
              <li>Duplicate submissions for the same room within 30 minutes are merged.</li>
              <li>Emergency hazards (gas leak, live wire) trigger immediate P1 alert.</li>
              <li>Feedback rating opens immediately upon ticket resolution.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
