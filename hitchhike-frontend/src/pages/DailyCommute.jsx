import { useState } from 'react';
import { MapPin, Square, Map, CalendarCheck } from 'lucide-react';
import Toggle from '../components/Toggle';

const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

const DEFAULT_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

const DETOUR_OPTIONS = [
  { id: 'strict', label: 'Strict' },
  { id: '1km', label: '+1 km' },
  { id: '2km', label: '+2 km' },
];

const VIBE_OPTIONS = [
  { id: 'any', label: 'Any' },
  { id: 'quiet', label: '🤫 Quiet' },
  { id: 'chatty', label: '💬 Chatty' },
];

const DailyCommute = () => {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedDays, setSelectedDays] = useState(DEFAULT_DAYS);
  const [departureTime, setDepartureTime] = useState('09:30');
  const [detour, setDetour] = useState('1km');
  const [vibe, setVibe] = useState('any');
  const [hasHelmet, setHasHelmet] = useState(true);
  const [womenOnly, setWomenOnly] = useState(false);

  const toggleDay = (id) => {
    setSelectedDays((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <header className="px-5 pt-8 pb-6">
        <p className="text-xs font-semibold tracking-wide text-gray-400">
          SET IT ONCE. RIDE IT EVERY DAY.
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900">
          Daily <span className="text-orange-500">Commute.</span>
        </h1>
      </header>

      <main className="px-5 space-y-4">
        {/* Route Setup */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">Add a new daily route</p>
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-semibold text-orange-600"
            >
              <Map size={13} strokeWidth={2.4} />
              Select on Map
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-3 pb-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="w-px flex-1 my-1.5 border-l-2 border-dashed border-gray-300" />
              <span className="h-3 w-3 rounded-sm bg-orange-500 shrink-0" />
            </div>

            <div className="flex-1 flex flex-col divide-y divide-gray-100">
              <button
                type="button"
                className="pb-3 text-left"
                onClick={() => {
                  /* Opens map overlay in a later pass */
                }}
              >
                <label className="text-[11px] font-semibold text-gray-400 pointer-events-none">
                  START POINT
                </label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin size={13} className="text-gray-400 shrink-0" />
                  <span
                    className={`text-sm ${
                      startPoint ? 'font-medium text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {startPoint || 'Where from?'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="pt-3 text-left"
                onClick={() => {
                  /* Opens map overlay in a later pass */
                }}
              >
                <label className="text-[11px] font-semibold text-gray-400 pointer-events-none">
                  DESTINATION
                </label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Square size={12} className="text-gray-400 shrink-0" />
                  <span
                    className={`text-sm ${
                      destination ? 'font-medium text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {destination || 'Where to?'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Schedule & Days */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 mb-2.5">REPEAT ON</p>
          <div className="flex justify-between gap-1.5">
            {DAYS.map(({ id, label }) => {
              const isActive = selectedDays.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleDay(id)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                      : 'border border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  {label.slice(0, 2)}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-400 mb-2">DEPARTURE TIME</p>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-medium text-gray-900 outline-none focus:border-orange-400"
            />
          </div>
        </section>

        {/* Preferences */}
        <section className="rounded-2xl bg-white p-5 shadow-sm space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2.5">DETOUR RADIUS</p>
            <div className="flex gap-2">
              {DETOUR_OPTIONS.map(({ id, label }) => {
                const isActive = detour === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDetour(id)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2.5">RIDE VIBE</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {VIBE_OPTIONS.map(({ id, label }) => {
                const isActive = vibe === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVibe(id)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="divide-y divide-gray-100 pt-1">
            <div className="py-2.5">
              <Toggle checked={hasHelmet} onChange={setHasHelmet} label="Spare helmet" />
            </div>
            <div className="py-2.5">
              <Toggle checked={womenOnly} onChange={setWomenOnly} label="Women-only ride" />
            </div>
          </div>
        </section>

        {/* Action Button */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-sm font-bold tracking-wide text-white shadow-sm shadow-orange-200 active:bg-orange-600 transition-colors"
        >
          <CalendarCheck size={18} strokeWidth={2.6} />
          SAVE DAILY COMMUTE
        </button>
      </main>
    </div>
  );
};

export default DailyCommute;