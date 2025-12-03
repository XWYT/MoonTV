/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Clover, Film, Home, Menu, Search, Star, Tv } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

import { useSite } from './SiteProvider';

interface SidebarContextType {
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
});

export const useSidebar = () => useContext(SidebarContext);

const Logo = () => {
  const { siteName } = useSite();
  return (
    <Link
      href='/'
      className='flex items-center justify-center h-16 select-none group'
    >
      {/* 故障风格 Logo */}
      <span className='text-2xl font-bold text-retro-text tracking-tighter font-mono border-2 border-transparent group-hover:border-retro-text px-2 uppercase'>
        {siteName}_
      </span>
    </Link>
  );
};

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  activePath?: string;
}

declare global {
  interface Window {
    __sidebarCollapsed?: boolean;
  }
}

const Sidebar = ({ onToggle, activePath = '/' }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.__sidebarCollapsed === 'boolean') {
      return window.__sidebarCollapsed;
    }
    return false;
  });

  useLayoutEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      const val = JSON.parse(saved);
      setIsCollapsed(val);
      window.__sidebarCollapsed = val;
    }
  }, []);

  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      if (isCollapsed) {
        document.documentElement.dataset.sidebarCollapsed = 'true';
      } else {
        delete document.documentElement.dataset.sidebarCollapsed;
      }
    }
  }, [isCollapsed]);

  const [active, setActive] = useState(activePath);

  useEffect(() => {
    if (activePath) {
      setActive(activePath);
    } else {
      const getCurrentFullPath = () => {
        const queryString = searchParams.toString();
        return queryString ? `${pathname}?${queryString}` : pathname;
      };
      setActive(getCurrentFullPath());
    }
  }, [activePath, pathname, searchParams]);

  const handleToggle = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    if (typeof window !== 'undefined') {
      window.__sidebarCollapsed = newState;
    }
    onToggle?.(newState);
  }, [isCollapsed, onToggle]);

  const handleSearchClick = useCallback(() => {
    router.push('/search');
  }, [router]);

  const contextValue = { isCollapsed };

  const [menuItems, setMenuItems] = useState([
    { icon: Film, label: 'MOVIES', href: '/douban?type=movie' },
    { icon: Tv, label: 'SERIES', href: '/douban?type=tv' },
    { icon: Clover, label: 'VARIETY', href: '/douban?type=show' },
  ]);

  useEffect(() => {
    const runtimeConfig = (window as any).RUNTIME_CONFIG;
    if (runtimeConfig?.CUSTOM_CATEGORIES?.length > 0) {
      setMenuItems((prevItems) => [
        ...prevItems,
        { icon: Star, label: 'CUSTOM', href: '/douban?type=custom' },
      ]);
    }
  }, []);

  // 辅助组件：侧边栏链接项
  const SidebarItem = ({ icon: Icon, label, href, onClick, isActive }: any) => (
    <Link
      href={href}
      onClick={onClick}
      data-active={isActive}
      className={`
        group flex items-center px-2 py-3 pl-4 
        text-gray-500 font-mono text-sm uppercase tracking-wider
        hover:text-retro-text hover:bg-retro-border/30
        data-[active=true]:text-retro-bg data-[active=true]:bg-retro-text 
        data-[active=true]:font-bold
        transition-all duration-mechanic ease-mechanic
        border-l-4 border-transparent
        data-[active=true]:border-l-4 data-[active=true]:border-retro-text
        ${isCollapsed ? 'justify-center pl-2' : 'justify-start'}
      `}
    >
      <div className='w-5 h-5 flex items-center justify-center'>
        <Icon className='w-4 h-4' />
      </div>
      {!isCollapsed && (
        <span className='ml-3 whitespace-nowrap'>{label}</span>
      )}
    </Link>
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className='hidden md:flex'>
        <aside
          data-sidebar
          className={`fixed top-0 left-0 h-screen bg-retro-bg border-r border-retro-border z-20 transition-all duration-mechanic ease-linear ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className='flex h-full flex-col'>
            {/* Logo */}
            <div className='relative h-16 border-b border-retro-border bg-retro-surface'>
               <div className={`absolute inset-0 flex items-center justify-center ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                 {!isCollapsed && <Logo />}
               </div>
               {/* 切换按钮：机械风格 */}
              <button
                onClick={handleToggle}
                className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center 
                  border border-retro-border hover:bg-retro-text hover:text-black hover:border-retro-text 
                  text-retro-text transition-colors duration-mechanic
                  ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-2'}`}
              >
                <Menu className='h-4 w-4' />
              </button>
            </div>

            {/* 导航 */}
            <nav className='flex-1 overflow-y-auto py-4 space-y-1'>
              <SidebarItem 
                icon={Home} 
                label="HOME" 
                href="/" 
                onClick={() => setActive('/')} 
                isActive={active === '/'} 
              />
              <SidebarItem 
                icon={Search} 
                label="SEARCH" 
                href="/search" 
                onClick={(e: any) => { e.preventDefault(); handleSearchClick(); setActive('/search'); }} 
                isActive={active === '/search'} 
              />
              
              <div className="my-4 border-t border-retro-border mx-4 opacity-50"></div>

              {menuItems.map((item) => {
                 const typeMatch = item.href.match(/type=([^&]+)/)?.[1];
                 const decodedActive = decodeURIComponent(active);
                 const isActive = decodedActive === decodeURIComponent(item.href) ||
                    (decodedActive.startsWith('/douban') && decodedActive.includes(`type=${typeMatch}`));
                 return (
                    <SidebarItem 
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      onClick={() => setActive(item.href)}
                      isActive={isActive}
                    />
                 )
              })}
            </nav>
            
            {/* 底部装饰：系统状态 */}
            {!isCollapsed && (
                <div className="p-4 border-t border-retro-border text-[10px] text-retro-dim font-mono">
                    <div className="flex justify-between">
                        <span>SYS: ONLINE</span>
                        <span className="animate-pulse">●</span>
                    </div>
                    <div className="mt-1">V.1.0.RC</div>
                </div>
            )}
          </div>
        </aside>
        <div className={`transition-all duration-mechanic ease-linear ${isCollapsed ? 'w-16' : 'w-64'}`}></div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
