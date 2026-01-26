import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Scissors, 
  Calendar, 
  Building2, 
  Settings,
  LogOut,
  Plus,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/splits', icon: Scissors, label: 'Splits' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { company, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get logo URL - check both logoUrl and logo for backwards compatibility
  const companyLogo = company?.logoUrl || company?.logo;

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-charcoal-100 pt-6 pb-4">
          {/* Logo */}
          <div className="flex items-center px-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-split-500 rounded-xl flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-2xl text-charcoal-900">Split</span>
            </div>
          </div>
          
          {/* Company Badge */}
          {company && (
            <div className="px-4 mb-6">
              <div className="p-3 bg-cream-100 rounded-xl">
                <div className="flex items-center gap-3">
                  {companyLogo ? (
                    <img 
                      src={companyLogo} 
                      alt={company.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-split-100 rounded-lg flex items-center justify-center">
                      <span className="text-split-600 font-semibold">
                        {company.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-900 truncate">
                      {company.name}
                    </p>
                    <p className="text-xs text-charcoal-500 capitalize">
                      {company.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-split-50 text-split-600'
                      : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </nav>
          
          {/* Create Split CTA */}
          <div className="px-4 mb-4">
            <button
              onClick={() => navigate('/splits/new')}
              className="btn-primary w-full"
            >
              <Plus className="w-4 h-4" />
              Create Split
            </button>
          </div>
          
          {/* Logout */}
          <div className="px-4 border-t border-charcoal-100 pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-charcoal-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Log out
            </button>
          </div>
        </div>
      </aside>
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-charcoal-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-split-500 rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl text-charcoal-900">Split</span>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-charcoal-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 inset-x-0 bg-white border-b border-charcoal-100 shadow-lg animate-slide-up">
            <nav className="p-4 space-y-1">
              {/* Company Badge for Mobile */}
              {company && (
                <div className="p-3 bg-cream-100 rounded-xl mb-4">
                  <div className="flex items-center gap-3">
                    {companyLogo ? (
                      <img 
                        src={companyLogo} 
                        alt={company.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-split-100 rounded-lg flex items-center justify-center">
                        <span className="text-split-600 font-semibold">
                          {company.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-900 truncate">
                        {company.name}
                      </p>
                      <p className="text-xs text-charcoal-500 capitalize">
                        {company.category}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-split-50 text-split-600'
                        : 'text-charcoal-600 hover:bg-charcoal-50'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              ))}
              
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/splits/new');
                }}
                className="btn-primary w-full mt-4"
              >
                <Plus className="w-4 h-4" />
                Create Split
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-charcoal-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 mt-2"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </nav>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}