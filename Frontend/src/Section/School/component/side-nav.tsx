//school/component
import { Link, useNavigate } from 'react-router-dom';
import { School, Building2, Users, BookOpen, LogOut, X, MenuIcon ,ClipboardIcon, Paperclip, SettingsIcon, LayoutDashboard} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/authContext';
import { Role } from '@/enum';

const navItems = [
  { href: '/system-admin', label: 'System Overview', icon: LayoutDashboard, roles: [Role.SystemAdmin] },
  { href: '/analytics', label: 'Analytics', icon: School },
  { href: '/system-admin/districts', label: 'Districts', icon: Building2, roles: [Role.SystemAdmin] },
  { href: '/system-admin/schools', label: 'Schools', icon: School, roles: [Role.SystemAdmin] },
  { href: '/teacher', label: 'Teachers', icon: Users },
  { href: '/students', label: 'Students', icon: BookOpen },
  { href: '/viewforms', label: 'Forms', icon: ClipboardIcon },
  { href: '/history', label: 'Point History', icon: ClipboardIcon },
  { href: '/print-report', label: 'Print Report', icon: Paperclip },
  { href: '/setup', label: 'Setup', icon: SettingsIcon },
];

export function SideNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const filteredItems = navItems.filter(item => {
    if (item.roles) {
      return !!user && (item.roles as string[]).includes(user.role);
    }
    return true;
  });

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Hamburger Icon for Small Screens */}
      <div className=" md:hidden p-2 fixed top-4 left-4 z-50">
        <Button variant="ghost" onClick={toggleMenu}>
          {isOpen ? <X /> : <MenuIcon color='#fff' />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div
          className="fixed inset-0 shadow-lg z-40 md:hidden overflow-y-auto bg-[#654f6f] min-h-screen h-full"
        >
          <nav className="w-64">
            <div className="p-4">
              <img src="/radu-logo.png" alt="Logo" className="w-14 h-14" />
            </div>
            <ul className="space-y-2 py-4">
              {filteredItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="flex items-center px-4 py-2  hover:bg-gray-100"
                    onClick={toggleMenu} // Close menu after navigation
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Logout Button */}
            <div className="px-4 py-2 mt-4 border-t">
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu(); // Close menu on logout
                }}
                className="flex items-center w-full px-4 py-2  "
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:block w-64 bg-[#654f6f] text-white shadow-lg h-full overflow-y-auto">
        <div className="p-4">
          <img src="/radu-logo-2.png" alt="Logo" className="w-full h-fit invert object-cover " />
        </div>
        <ul className="space-y-2 py-4">
          {filteredItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="flex items-center px-4 py-2  "
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {/* Logout Button */}
        <div className="px-4 py-2 mt-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2  "
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}