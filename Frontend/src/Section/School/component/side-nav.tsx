import { Link, useNavigate } from 'react-router-dom';
import { School, UserPlus, Users, BookOpen, LogOut, X, MenuIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/addschool', label: 'School', icon: School },
  { href: '/addteacher', label: 'Add Teacher', icon: UserPlus },
  { href: '/addstudent', label: 'Add Student', icon: UserPlus },
  { href: '/viewteacher', label: 'View Teachers', icon: Users },
  { href: '/viewstudent', label: 'View Students', icon: BookOpen },
  // { href: '/createform', label: 'Create Forms', icon: ClipboardIcon },
  // { href: '/viewforms', label: 'View Forms', icon: ClipboardIcon },
  // { href: '/pointhistory', label: 'Point History', icon: ClipboardIcon },
];

export function SideNav() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    // Remove token from localStorage and sessionStorage
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  return (
    <>
      {/* Hamburger Icon for Small Screens */}
      <div className="bg-white md:hidden p-2 fixed top-4 left-4 z-50">
        <Button variant="ghost" onClick={toggleMenu}>
          {isOpen ? <X /> : <MenuIcon />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-white shadow-lg z-40 md:hidden overflow-y-auto"
          style={{ height: '100vh' }}
        >
          <nav className="w-64">
            <div className="p-4">
              <img src="/logo2.png" alt="Logo" className="w-14 h-14" />
            </div>
            <ul className="space-y-2 py-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
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
                className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:block w-64 bg-white shadow-lg h-screen">
        <div className="p-4">
          <img src="/logo2.png" alt="Logo" className="w-14 h-14" />
        </div>
        <ul className="space-y-2 py-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
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
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
