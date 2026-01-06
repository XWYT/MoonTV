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
      <span className='text-2xl font-semibold tracking-tight text-white drop-shadow-sm group-hover:scale-[1.01] transition-transform duration-200'>
        {siteName}
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
    if (
      typeof window !== 'undefined' &&
      typeof window.__sidebarCollapsed === 'boolean'
    ) {
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
        group flex items-center px-3 py-3 rounded-2xl
        text-retro-dim text-xs font-semibold tracking-wide uppercase
        hover:text-white hover:bg-white/5 hover:shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)]
        data-[active=true]:text-white data-[active=true]:bg-white/10 data-[active=true]:border-white/15
        transition-all duration-200 ease-out
        border border-transparent
        ${isCollapsed ? 'justify-center' : 'justify-start'}
      `}
    >
      <div className='w-5 h-5 flex items-center justify-center'>
        <Icon className='w-5 h-5' />
      </div>
      {!isCollapsed && <span className='ml-3 whitespace-nowrap'>{label}</span>}
    </Link>
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className='hidden md:flex'>
        <aside
          data-sidebar
          className={`fixed top-0 left-0 h-screen bg-retro-bg/70 backdrop-blur-2xl border-r border-retro-border/60 z-20 transition-all duration-300 ease-out shadow-[0_25px_60px_-35px_rgba(0,0,0,0.8)] ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className='flex h-full flex-col'>
            {/* Logo */}
            <div className='relative h-16 border-b border-retro-border/60 bg-white/5'>
              <div
                className={`absolute inset-0 flex items-center justify-center ${
                  isCollapsed ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {!isCollapsed && <Logo />}
              </div>
              {/* 切换按钮 */}
              <button
                onClick={handleToggle}
                className={`absolute top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-2xl
                  border border-white/10 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white
                  transition-all duration-300 shadow-[0_10px_30px_-25px_rgba(0,0,0,0.8)]
                  ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-3'}`}
              >
                <Menu className='h-4 w-4' />
              </button>
            </div>

            {/* 导航 */}
            <nav className='flex-1 overflow-y-auto py-4 space-y-2 px-3'>
              <SidebarItem
                icon={Home}
                label='HOME'
                href='/'
                onClick={() => setActive('/')}
                isActive={active === '/'}
              />
              <SidebarItem
                icon={Search}
                label='SEARCH'
                href='/search'
                onClick={(e: any) => {
                  e.preventDefault();
                  handleSearchClick();
                  setActive('/search');
                }}
                isActive={active === '/search'}
              />

              <div className='my-4 border-t border-retro-border mx-4 opacity-50'></div>

              {menuItems.map((item) => {
                const typeMatch = item.href.match(/type=([^&]+)/)?.[1];
                const decodedActive = decodeURIComponent(active);
                const isActive =
                  decodedActive === decodeURIComponent(item.href) ||
                  (decodedActive.startsWith('/douban') &&
                    decodedActive.includes(`type=${typeMatch}`));
                return (
                  <SidebarItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    onClick={() => setActive(item.href)}
                    isActive={isActive}
                  />
                );
              })}
            </nav>

            {/* 底部装饰：系统状态 */}
            {!isCollapsed && (
              <div className='p-4 border-t border-retro-border/60 text-[11px] text-retro-dim tracking-wide'>
                <div className='flex items-center justify-between'>
                  <span className='text-white/70'>在线 · 流畅</span>
                  <span className='inline-flex items-center gap-1 text-primary-300'>
                    <span className='h-2 w-2 rounded-full bg-primary-400 animate-pulse' />
                    UHD
                  </span>
                </div>
                <div className='mt-1 text-white/50'>
                  Version 1.0 · Optimized UI
                </div>
              </div>
            )}
          </div>
        </aside>
        <div
          className={`transition-all duration-mechanic ease-linear ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        ></div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
