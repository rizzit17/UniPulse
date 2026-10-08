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
  
  const [block, setBlock] = useState<string>('Block C');
  const [floor, setFloor] = useState<string>('Level 2');
  const [room, setRoom] = useState<string>('Room 214');
  
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<RequestPriority>('P2');
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
    { id: 'HVAC', name: 'HVAC & Cooling', icon: 'ac_unit' },
    { id: 'ELEC', name: 'Electrical & Power', icon: 'bolt' },
    { id: 'IT_NET', name: 'Wi-Fi & Network', icon: 'wifi' },
    { id: 'CIVIL', name: 'Plumbing & Water', icon: 'water_drop' },
    { id: 'FIXTURES', name: 'Doors & Furniture', icon: 'chair' },
    { id: 'SECURITY', name: 'Safety & Access', icon: 'lock' },
  ];

  const priorities: Array<{ p: RequestPriority; label: string; sla: string }> = [
    { p: 'P1', label: 'P1 Critical', sla: '2 hrs guaranteed' },
    { p: 'P2', label: 'P2 High', sla: '4 hrs target' },
    { p: 'P3', label: 'P3 Medium', sla: '24 hrs standard' },
    { p: 'P4', label: 'P4 Low', sla: '48 hrs scheduled' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and description.');
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
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6 text-on-surface">
      {/* Top back navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1 font-title-sm text-xs text-secondary hover:text-on-surface transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Requests</span>
        </button>
      </div>

      {/* Header */}
      <div className="pb-4 border-b border-outline-variant">
        <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-normal">
          New Service Request
        </h1>
        <p className="font-body-sm text-body-sm text-secondary m-0 mt-1">
          Submit physical maintenance, repair, or facility issues for prompt campus resolution.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-error-container text-error text-body-sm border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Step 1: Category / Trade */}
        <div className="bg-surface-container-lowest p-6 border border-outline-variant flex flex-col gap-3">
          <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
            1. Issue Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {trades.map((trd) => {
              const isSelected = selectedTrade === trd.id;
              return (
                <button
                  key={trd.id}
                  type="button"
                  onClick={() => setSelectedTrade(trd.id)}
                  className={`p-3 text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-surface border-primary text-primary font-semibold ring-1 ring-primary'
                      : 'bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                    {trd.icon}
                  </span>
                  <span className="font-title-sm text-xs">{trd.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Location */}
        <div className="bg-surface-container-lowest p-6 border border-outline-variant flex flex-col gap-3">
          <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
            2. Campus Location
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-label-caption text-label-caption text-secondary">Block / Building</span>
              <input
                type="text"
                required
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="e.g. Block C"
                className="bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-on-surface"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-caption text-label-caption text-secondary">Floor / Level</span>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="e.g. Level 2"
                className="bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-on-surface"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-caption text-label-caption text-secondary">Room / Lab No.</span>
              <input
                type="text"
                required
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Room 214"
                className="bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-on-surface"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Issue Details */}
        <div className="bg-surface-container-lowest p-6 border border-outline-variant flex flex-col gap-4">
          <label className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
            3. Issue Details
          </label>

          <div className="flex flex-col gap-1">
            <span className="font-label-caption text-label-caption text-secondary">Short Summary</span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AC cooling unit not blowing cold air"
              className="bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-on-surface"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label-caption text-label-caption text-secondary">Detailed Description</span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, symptoms, equipment involved, and any safety hazards..."
              className="bg-surface-container-low border border-outline-variant p-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-on-surface resize-y"
            />
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5 pt-2">
            <span className="font-label-caption text-label-caption text-secondary">Priority Level</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {priorities.map(({ p, label, sla }) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`p-2.5 text-left border transition-all cursor-pointer flex flex-col ${
                      isSelected
                        ? 'bg-surface border-primary text-on-surface ring-1 ring-primary'
                        : 'bg-surface-container-low border-outline-variant text-secondary hover:bg-surface-container'
                    }`}
                  >
                    <span className="font-title-sm text-xs font-semibold">{label}</span>
                    <span className="font-label-code text-[11px] text-secondary mt-0.5">{sla}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-transparent text-secondary hover:text-on-surface font-title-sm text-title-sm border border-outline-variant cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-title-sm font-semibold transition-colors border-none cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequestScreen;
