import { Link, useNavigate } from 'react-router-dom';
import { LogOut, X, MenuIcon, ClipboardIcon, Users, School, Target, Paperclip, SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/authContext';
import { canAccess, type TabKey } from '@/lib/roleAccess';

const allTeacherItems: { href: string; label: string; icon: any; tab: TabKey }[] = [
  { href: '/teachers/analytics', label: 'Analytics', icon: School, tab: 'analytics' },
  { href: '/teachers/students', label: 'Student Roster', icon: Users, tab: 'students' },
  { href: '/teachers/viewforms', label: 'Forms', icon: ClipboardIcon, tab: 'forms' },
  { href: '/teachers/managepoints', label: 'Forms', icon: ClipboardIcon, tab: 'forms' },
  { href: '/teachers/history', label: 'Point History', icon: Target, tab: 'pointHistory' },
  { href: '/teachers/print-report', label: 'Print Report', icon: Paperclip, tab: 'printReport' },
  { href: '/teachers/students-setup', label: 'Setup', icon: SettingsIcon, tab: 'setup' },
];

export function TeacherSideNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [toogle, Settoogle] = useState(false);

  // Lead teachers get the full Forms (manage + view), regular Team Members
  // only get the manage-points page. Filter the duplicate Forms entry first,
  // then run the matrix filter so unauthorized tabs are dropped.
  const isLead = user?.type === 'Lead';
  const navItems = allTeacherItems
    .filter((item) => {
      if (item.href === '/teachers/managepoints') return !isLead;
      if (item.href === '/teachers/viewforms') return isLead;
      return true;
    })
    .filter((item) => canAccess(user, item.tab));

  const toogleX = () => {
    Settoogle(!toogle);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
    <div className='bg-white md:hidden'>
      {
        !toogle ? <Button variant={"ghost"} onClick={()=> toogleX()}><MenuIcon /></Button>:<Button variant={"ghost"} onClick={()=> toogleX()}><X /></Button>
      }
    </div>

    {
      toogle && <nav className={`w-64 bg-[#654f6f] text-black shadow-lg  ${!toogle ? "max-md:hidden":""}`}>
      <div className="p-4">
      <img src="/hero1.png" alt="" className='w-14  h-14' />
      </div>
      <ul className="space-y-2 py-4">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link to={item.href} className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
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
    }

<nav className={ `w-64 bg-[#654f6f] shadow-lg h-full overflow-y-auto max-md:hidden`}>
      <div className="p-4">
      <img src="/radu-logo-2.png" alt="" className='w-full invert object-cover' />
      </div>
      <ul className="space-y-2 py-4">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link to={item.href} className="flex items-center px-4 py-2 text-white ">
              <item.icon className="h-5 w-5 mr-2" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2 mt-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-white"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </button>
      </div>
    </nav>

    </>
  );
}
