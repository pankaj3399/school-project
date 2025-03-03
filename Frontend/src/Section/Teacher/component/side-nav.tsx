import { Link, useNavigate } from 'react-router-dom';
import { LogOut,X,MenuIcon,ClipboardIcon, Users, School, Target, Paperclip} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/api';



export function TeacherSideNav() {
  const navigate = useNavigate();
  const[toogle,Settoogle] = useState(false);
  const [navItems, setNavItems] = useState<any[]>([
    { href: '/teachers/managepoints', label: 'Manage Points', icon: ClipboardIcon }
  ])

  useEffect(() => {
    // Fetch teacher details
    const fetchTeacher = async () => {
      const response = await getCurrentUser();
      if(response.user.type == "Lead"){
        setNavItems([
          { href: '/teachers/viewforms', label: 'Forms', icon: ClipboardIcon },
          { href: '/teachers/students', label: 'View Students', icon: Users },
          { href: '/teachers/analytics', label: 'Analytics', icon: School },
          { href: '/teachers/history', label: 'History', icon: Target },
          { href: '/teachers/print-report', label: 'Print Report', icon: Paperclip }
        ])
      }
    };
    fetchTeacher();
  }, []);

  const toogleX = () =>{
    Settoogle(!toogle);
  }

  const handleLogout = () => {
    
    localStorage.removeItem('token'); 
    sessionStorage.removeItem('token'); 

    
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

<nav className={ `w-64 bg-[#654f6f] shadow-lg max-md:hidden`}>
      <div className="p-4">
      <img src="/logo3.png" alt="" className='w-56 invert object-cover' />
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