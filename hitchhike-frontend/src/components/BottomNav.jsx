import { NavLink } from 'react-router-dom';
// NAYA: Activity icon ko import kiya hai "My Rides" ke liye
import { Home, MapPin, Bike, Calendar, User, Activity } from 'lucide-react';

// Each tab maps a route to its icon + label. Centralizing this makes it
// trivial to reorder tabs or add a sixth later without touching markup.
const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/book', label: 'Book', icon: MapPin },
  { to: '/offer', label: 'Offer', icon: Bike },
  // NAYA: My Rides ka tab yahan add kiya hai
  { to: '/my-rides', label: 'Rides', icon: Activity },
  { to: '/commute', label: 'Commute', icon: Calendar },
  { to: '/profile', label: 'Profile', icon: User },
];

const BottomNav = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex flex-col items-center justify-center gap-1 py-2.5 transition-colors duration-200 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                      isActive ? 'bg-indigo-50' : 'bg-transparent'
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.4 : 2}
                      className="transition-all duration-200"
                    />
                  </span>
                  <span
                    className={`text-[11px] leading-none ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;