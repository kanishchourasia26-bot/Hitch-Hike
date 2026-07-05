/**
 * Small right-aligned toggle switch used across settings/preference lists
 * (OfferRide, DailyCommute, and future Profile settings screens).
 */
const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between py-1"
  >
    <span className="text-sm font-medium text-gray-800">{label}</span>
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-orange-500' : 'bg-gray-200'
      }`}
    >
      <span
        className="inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          height: '18px',
          width: '18px',
          transform: checked ? 'translateX(22px)' : 'translateX(4px)',
        }}
      />
    </span>
  </button>
);

export default Toggle;
