import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Category, CreateRequestDto, RequestPriority, ServiceRequest } from '../types/api';

interface NewRequestScreenProps {
  onSuccess: (created: ServiceRequest) => void;
  onCancel: () => void;
}

export const NewRequestScreen: React.FC<NewRequestScreenProps> = ({ onSuccess, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<string>('HVAC');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  
  const [block, setBlock] = useState<string>('BLK-C');
  const [floor, setFloor] = useState<string>('Level 2 (West Wing)');
  const [room, setRoom] = useState<string>('RM-214');
  const [assetTag, setAssetTag] = useState<string>('CHILLER-FAN-02');
  
  const [title, setTitle] = useState<string>('AC not cooling — high ambient temp in Lab 214');
  const [description, setDescription] = useState<string>(
    'Room temperature registered at 29.5°C despite thermostat set point locked at 19°C. Compressors vibrating excessively on Level 2 ceiling bay. Air vents emitting faint warm hum with zero convection cooling.'
  );
  const [priority, setPriority] = useState<RequestPriority>('P2');
  const [evidenceAttached, setEvidenceAttached] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCatId(cats[0].id);
      }
    });
  }, []);

  const trades = [
    { id: 'HVAC', code: 'TRD-01', name: 'Electrical & HVAC', icon: 'ac_unit', desc: 'Cooling, chillers, power, circuits' },
    { id: 'IT_NET', code: 'TRD-02', name: 'IT & Connectivity', icon: 'lan', desc: 'Ethernet, AP ports, racks' },
    { id: 'CIVIL', code: 'TRD-03', name: 'Civil & Plumbing', icon: 'plumbing', desc: 'Leaks, masonry, sanitary' },
    { id: 'AV_INST', code: 'TRD-04', name: 'AV & Stage Gear', icon: 'podium', desc: 'Projectors, audio desks, mics' },
    { id: 'FIXTURES', code: 'TRD-05', name: 'Furniture & Joinery', icon: 'chair', desc: 'Desks, locks, glazing, partitions' },
    { id: 'ACCESS', code: 'TRD-06', name: 'Security & Keys', icon: 'key', desc: 'Card readers, latches, turnstiles' },
  ];

  const getSlaInfo = (p: RequestPriority) => {
    switch (p) {
      case 'P1':
        return { response: '15 min dispatch', resolve: '2 hours guaranteed', target: 'P1 CRITICAL · HAZARD PROTOCOL', color: 'text-error' };
      case 'P2':
        return { response: '30 min dispatch', resolve: '4 hours guaranteed', target: 'P2 HIGH · ELEVATED PRIORITY', color: 'text-primary' };
      case 'P3':
        return { response: '2 hours dispatch', resolve: '24 hours guaranteed', target: 'P3 STANDARD · WORK ORDER', color: 'text-on-surface' };
      case 'P4':
      default:
        return { response: '4 hours dispatch', resolve: '48 hours guaranteed', target: 'P4 DEFERRED · PREVENTATIVE', color: 'text-secondary' };
    }
  };

  const currentSla = getSlaInfo(priority);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide incident title and technical assessment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dto: CreateRequestDto = {
        title,
        description,
        categoryId: selectedCatId || (categories[0]?.id ?? 'c0000000-0000-0000-0000-000000000001'),
        priority,
        locationBlock: block,
        locationRoom: room,
        locationFloor: floor,
      };

      const created = await api.createRequest(dto);
      onSuccess(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch docket';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col text-on-surface bg-surface">
      {/* Top Registration Bar / Folio Sub-Header */}
      <div className="w-full bg-surface-container-low px-4 sm:px-8 lg:px-12 py-3 border-b border-outline-variant">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 font-label-stamp text-label-stamp uppercase tracking-widest text-secondary hover:text-on-surface transition-colors bg-transparent border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              <span>Return to Manifest Ledger</span>
            </button>
            <span className="text-outline-variant font-label-code text-label-code">/</span>
            <span className="font-label-stamp text-label-stamp uppercase tracking-wider text-primary font-semibold">
              [FORM 804-A: DISPATCH DOCKET]
            </span>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant font-label-code text-label-code text-[11px]">
            <span>SESSION: AUTH-CAMPUS-9912</span>
            <span className="text-outline-variant">•</span>
            <span className="text-tertiary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block"></span>
              [DISPATCH CHANNEL READY]
            </span>
          </div>
        </div>
      </div>

      {/* Page Introduction Banner */}
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-8 pb-6 bg-surface border-b border-outline-variant">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="font-label-stamp text-label-stamp uppercase tracking-widest text-primary px-1.5 py-0.5 bg-surface-container-high leading-none">
                INCIDENT REGISTRY
              </span>
              <span className="font-label-caption text-label-caption text-secondary">
                CAMPUS INFRASTRUCTURE SYSTEM
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-normal">
              File an Incident Report
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1 max-w-2xl">
              Route physical facility disruptions, civil damages, or instrumentation faults directly to central campus dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 font-label-code text-label-code text-[11px] bg-surface-container px-4 py-2 border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
            <span className="text-on-surface">DIRECT DISPATCH TO ON-CALL NOC TEAM</span>
          </div>
        </div>
      </div>

      {/* Main Split Architecture Grid */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 bg-surface">
        <form onSubmit={handleSubmit} className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Primary Filing Manifest Column (8 Cols / ~65%) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* SECTION 1: Category & Trade Classification */}
            <section className="bg-surface-container-lowest p-6 sm:p-8 flex flex-col gap-4 border border-outline-variant">
              <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-label-code text-label-code font-semibold px-2 py-0.5 bg-surface-container-high text-on-surface">
                    SEC 01
                  </span>
                  <h2 className="font-title-md text-title-md text-on-surface uppercase tracking-wide font-semibold">
                    Category &amp; Trade Classification
                  </h2>
                </div>
                <span className="font-label-stamp text-label-stamp text-secondary uppercase">
                  [SELECT APPLICABLE TRADE]
                </span>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Specify the trade domain responsible for triage, tools requisition, and field crew assignment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {trades.map((trd) => {
                  const isSelected = selectedTrade === trd.id;
                  return (
                    <div
                      key={trd.id}
                      onClick={() => setSelectedTrade(trd.id)}
                      className={`p-4 transition-all flex flex-col justify-between h-28 cursor-pointer border ${
                        isSelected
                          ? 'bg-surface border-2 border-primary'
                          : 'bg-surface-container-low border-outline-variant/70 hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`material-symbols-outlined text-[24px] ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                          {trd.icon}
                        </span>
                        <span className={`font-label-code text-[10px] ${isSelected ? 'text-primary font-bold' : 'text-secondary'}`}>
                          [{trd.code}]
                        </span>
                      </div>
                      <div>
                        <div className="font-title-sm text-title-sm text-on-surface font-semibold">{trd.name}</div>
                        <span className="font-label-caption text-[11px] text-secondary leading-tight block mt-0.5">
                          {trd.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION 2: Precise Spatial Matrix */}
            <section className="bg-surface-container-lowest p-6 sm:p-8 flex flex-col gap-4 border border-outline-variant">
              <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-label-code text-label-code font-semibold px-2 py-0.5 bg-surface-container-high text-on-surface">
                    SEC 02
                  </span>
                  <h2 className="font-title-md text-title-md text-on-surface uppercase tracking-wide font-semibold">
                    Precise Spatial Matrix &amp; Equipment Pin
                  </h2>
                </div>
                <span className="font-label-stamp text-label-stamp text-secondary uppercase">
                  [LOCATION TAGGING]
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider" htmlFor="campus-block">
                    Campus Zone &amp; Sector Block
                  </label>
                  <select
                    id="campus-block"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full bg-surface-container-low px-3.5 py-2.5 font-body-md text-on-surface border border-outline-variant focus:outline-none focus:bg-surface-container-lowest"
                  >
                    <option value="BLK-C">Block C (Faculty &amp; Labs Spine)</option>
                    <option value="BLK-A">Block A (Administrative &amp; NOC Core)</option>
                    <option value="BLK-B">Block B (Auditorium &amp; Lecture Halls)</option>
                    <option value="HOSTEL-H4">Hostel H-4 (Residential Quad)</option>
                    <option value="LIB-CENTRAL">Central University Library</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider" htmlFor="floor-level">
                    Floor Level &amp; Section
                  </label>
                  <input
                    id="floor-level"
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="e.g. Level 2, West Corridor"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 font-body-md text-on-surface border border-outline-variant focus:outline-none focus:bg-surface-container-lowest"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider" htmlFor="room-number">
                    Specific Room / Laboratory Identifier
                  </label>
                  <input
                    id="room-number"
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Lab 214 or RM-302"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 font-label-code text-on-surface border border-outline-variant focus:outline-none focus:bg-surface-container-lowest"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider" htmlFor="asset-tag">
                    Equipment Asset Tag / Serial Barcode (Optional)
                  </label>
                  <input
                    id="asset-tag"
                    type="text"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="e.g. CHILLER-FAN-02 or BARCODE-994"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 font-label-code text-on-surface border border-outline-variant focus:outline-none focus:bg-surface-container-lowest"
                  />
                </div>
              </div>
            </section>

            {/* SECTION 3: Incident Narrative & Urgency Level */}
            <section className="bg-surface-container-lowest p-6 sm:p-8 flex flex-col gap-4 border border-outline-variant">
              <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-label-code text-label-code font-semibold px-2 py-0.5 bg-surface-container-high text-on-surface">
                    SEC 03
                  </span>
                  <h2 className="font-title-md text-title-md text-on-surface uppercase tracking-wide font-semibold">
                    Incident Narrative &amp; Operational Urgency
                  </h2>
                </div>
                <span className="font-label-stamp text-label-stamp text-secondary uppercase">
                  [FAULT LOGGING]
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider" htmlFor="req-title">
                  Incident Subject / Brief Fault Summary
                </label>
                <input
                  id="req-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Power socket sparking near projector — Lab 304"
                  className="w-full bg-surface-container-low px-3.5 py-2.5 font-body-md text-on-surface border border-outline-variant focus:outline-none focus:bg-surface-container-lowest text-[15px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider" htmlFor="req-desc">
                  Technical Narrative &amp; Environmental Impact
                </label>
                <textarea
                  id="req-desc"
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the precise mechanical, electrical, or structural symptom observed..."
                  className="w-full bg-surface-container-low p-3.5 font-body-md text-on-surface border border-outline-variant focus:outline-none focus:bg-surface-container-lowest text-[14px] leading-relaxed"
                />
              </div>

              {/* Priority Radio Pills */}
              <div className="flex flex-col gap-2 pt-2">
                <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                  Operational Urgency &amp; Impact Rating
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'P1', label: 'P1 Critical', sub: 'Hazard / Safety' },
                    { id: 'P2', label: 'P2 High', sub: 'Lab Disruption' },
                    { id: 'P3', label: 'P3 Standard', sub: 'Maintenance' },
                    { id: 'P4', label: 'P4 Routine', sub: 'Scheduled' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setPriority(lvl.id as RequestPriority)}
                      className={`p-2.5 text-left border cursor-pointer transition-colors ${
                        priority === lvl.id
                          ? 'bg-inverse-surface text-inverse-on-surface border-inverse-surface font-semibold'
                          : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
                      }`}
                    >
                      <div className="font-label-stamp text-[12px]">{lvl.label}</div>
                      <div className="font-label-caption text-[10px] opacity-80 mt-0.5">{lvl.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 4: Evidence Gallery */}
            <section className="bg-surface-container-lowest p-6 sm:p-8 flex flex-col gap-4 border border-outline-variant">
              <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-label-code text-label-code font-semibold px-2 py-0.5 bg-surface-container-high text-on-surface">
                    SEC 04
                  </span>
                  <h2 className="font-title-md text-title-md text-on-surface uppercase tracking-wide font-semibold">
                    Photographic Evidence &amp; Visual Artifacts
                  </h2>
                </div>
                <span className="font-label-stamp text-label-stamp text-secondary uppercase">
                  [ATTACHMENTS]
                </span>
              </div>

              <div className="p-6 border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-secondary mb-2">add_photo_alternate</span>
                <div className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Drop camera capture or facility documentation
                </div>
                <p className="font-body-sm text-secondary mt-1 text-[12px]">
                  JPEG, PNG, or PDF formats up to 15MB. Geotag and timestamp recorded on ingest.
                </p>
                <button
                  type="button"
                  onClick={() => setEvidenceAttached(!evidenceAttached)}
                  className="mt-3 px-4 py-1.5 bg-surface-container hover:bg-surface-container-highest border border-outline-variant font-label-stamp text-label-stamp cursor-pointer"
                >
                  {evidenceAttached ? 'Attach Sample Photos [Attached: 2]' : 'Select Files from Terminal'}
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Dispatch Review & Live SLA Docket (4 Cols / ~35%) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
            
            <div className="bg-surface-container-lowest p-6 border border-outline-variant flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                  DISPATCH REVIEW DOCKET
                </span>
                <span className="w-2 h-2 rounded-full bg-primary"></span>
              </div>

              <div>
                <span className="font-label-caption text-label-caption text-secondary uppercase block">
                  Target Trade Wing
                </span>
                <div className="font-title-md text-title-md text-on-surface font-semibold mt-0.5">
                  {trades.find((t) => t.id === selectedTrade)?.name}
                </div>
              </div>

              <div>
                <span className="font-label-caption text-label-caption text-secondary uppercase block">
                  Location Routing
                </span>
                <div className="font-label-code text-label-code text-on-surface bg-surface-container px-2 py-1 mt-1 inline-block border border-outline-variant">
                  {block} · {floor} · {room}
                </div>
              </div>

              <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col gap-2">
                <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                  SLA DISPATCH GUARANTEE
                </span>
                <div className="font-label-code text-title-md font-bold text-primary">
                  {currentSla.response}
                </div>
                <div className="font-body-sm text-secondary text-[12px]">
                  Resolution Goal: <strong className="text-on-surface">{currentSla.resolve}</strong>
                </div>
                <div className="font-label-code text-[11px] text-tertiary font-semibold mt-1">
                  ● Automated technician workload balancing active
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error-container text-error text-[12px] border border-error/30">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3.5 px-4 font-title-sm text-title-sm uppercase tracking-wider flex items-center justify-center gap-2 border-none cursor-pointer font-semibold transition-colors mt-2"
              >
                <span>{loading ? 'Transmitting Docket...' : 'Transmit Service Request'}</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full bg-transparent hover:bg-surface-container text-secondary py-2 font-title-sm text-title-sm uppercase border border-outline-variant cursor-pointer transition-colors"
              >
                Discard &amp; Exit
              </button>
            </div>

            {/* Physical Plant Compliance Note */}
            <div className="p-4 bg-surface-container border border-outline-variant text-secondary font-label-code text-[11px] leading-relaxed">
              <div className="font-semibold text-on-surface mb-1">REGULATION CODE 44-FAC:</div>
              All high-voltage or hazardous mechanical complaints require on-site perimeter cordon within 15 minutes of acknowledgement.
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};
