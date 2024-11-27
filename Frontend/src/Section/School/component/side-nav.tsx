import { Link, useNavigate } from 'react-router-dom';
import { School, UserPlus, Users, BookOpen, LogOut,} from 'lucide-react';

const navItems = [
  { href: '/addschool', label: 'Add School', icon: School },
  { href: '/viewschool', label: 'View Schools', icon: School },
  { href: '/addteacher', label: 'Add Teacher', icon: UserPlus },
  { href: '/addstudent', label: 'Add Student', icon: UserPlus },
  { href: '/viewteacher', label: 'View Teachers', icon: Users },
  { href: '/view', label: 'View Students', icon: BookOpen },
];

export function SideNav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    
    localStorage.removeItem('token'); 
    sessionStorage.removeItem('token'); 

    
    navigate('/');
  };

  return (
    <>
    
    
    <nav className="w-64 bg-white shadow-lg">
      <div className="p-4">
        <h1 className="text-2xl font-semibold text-blue-600">PointEdu</h1>
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
    </>
  );
}
