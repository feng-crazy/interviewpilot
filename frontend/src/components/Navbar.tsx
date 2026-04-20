import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar" role="navigation" aria-label="主导航">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          InterviewPilot
        </Link>
      </div>
      
      <div className="navbar-links">
        <Link 
          to="/" 
          className={`navbar-link ${isActive('/') ? 'active' : ''}`}
          aria-current={isActive('/') ? 'page' : undefined}
        >
          首页
        </Link>
        
        <Link 
          to="/positions" 
          className={`navbar-link ${isActive('/positions') ? 'active' : ''}`}
          aria-current={isActive('/positions') ? 'page' : undefined}
        >
          岗位库
        </Link>
        
        <Link 
          to="/history" 
          className={`navbar-link ${isActive('/history') ? 'active' : ''}`}
          aria-current={isActive('/history') ? 'page' : undefined}
        >
          面试记录
        </Link>
      </div>
    </nav>
  );
}