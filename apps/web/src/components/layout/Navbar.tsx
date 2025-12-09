'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Home, 
  LayoutDashboard, 
  Palette, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { getProfile, getWebSettings, getMenuVisibility } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
}

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, isLoading, signOut } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [profileFullName, setProfileFullName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('user');
  const [userPlan, setUserPlan] = useState<string>('Free');
  const [websiteLogo, setWebsiteLogo] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('e-BizCard');
  const [menuVisibility, setMenuVisibility] = useState<Record<string, boolean>>({});
  const [navbarColor, setNavbarColor] = useState<string>('#ffffff');
  const [navbarFontColor, setNavbarFontColor] = useState<string>('#000000');

  // Transform auth user to navbar user format
  // Use full_name from profile table (via API) if available, otherwise fallback to user_metadata
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email || '',
    full_name: profileFullName || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
    avatar_url: profileImageUrl || authUser.user_metadata?.avatar_url,
    role: userRole
  } : null;

  // Load website settings (logo and site name)
  useEffect(() => {
    const loadWebsiteSettings = async () => {
      try {
        const data = await getWebSettings();
        
        if (data.success && data.settings) {
          if (data.settings.logo_url) {
            setWebsiteLogo(data.settings.logo_url);
          }
          if (data.settings.site_name) {
            setSiteName(data.settings.site_name);
          }
          if (data.settings.navbar_color) {
            setNavbarColor(data.settings.navbar_color);
          }
          if (data.settings.navbar_font_color) {
            setNavbarFontColor(data.settings.navbar_font_color);
          }
        }
      } catch (error) {
        console.warn('Navbar: Error loading website settings:', error);
      }
    };
    
    loadWebsiteSettings();

    // Listen for custom events when settings are updated
    const handleSettingsUpdate = () => {
      loadWebsiteSettings();
    };

    window.addEventListener('webSettingsUpdated', handleSettingsUpdate);
    window.addEventListener('menuVisibilityUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('webSettingsUpdated', handleSettingsUpdate);
      window.removeEventListener('menuVisibilityUpdated', handleSettingsUpdate);
    };
  }, []);
  
  // Load profile data from profiles table via API
  useEffect(() => {
    const loadProfileData = async () => {
      if (!authUser?.id) return;
      
      try {
        const result = await getProfile();
        
        if (result.success && result.profile) {
          // Load profile image
          const imageUrl = result.profile.avatar_url || result.profile.profile_image;
          if (imageUrl) {
            setProfileImageUrl(imageUrl);
          }
          
          // Load full_name from profile table
          if (result.profile.full_name) {
            setProfileFullName(result.profile.full_name);
          }
          
          // Load user role and plan
          // user_type and user_plan are now properly typed
          // Use ?? to preserve actual values from database (including 'user' and 'Free')
          const role = result.profile.user_type ?? result.profile.role ?? 'user';
          const plan = result.profile.user_plan ?? 'Free';
          setUserRole(role);
          setUserPlan(plan);
          
          // Debug log to check what we're getting
          console.log('Navbar: Profile data:', {
            full_name: result.profile.full_name,
            user_type: result.profile.user_type,
            role: result.profile.role,
            user_plan: result.profile.user_plan,
            email: result.profile.email
          });
        }
      } catch (error) {
        console.warn('Navbar: Error loading profile data:', error);
      }
    };
    
    loadProfileData();
  }, [authUser]);

  // Reload website settings and menu visibility when user logs in
  useEffect(() => {
    if (authUser) {
      // Reload settings when user is authenticated
      const loadWebsiteSettings = async () => {
        try {
          const data = await getWebSettings();
          
          if (data.success && data.settings) {
            if (data.settings.logo_url) {
              setWebsiteLogo(data.settings.logo_url);
            }
            if (data.settings.site_name) {
              setSiteName(data.settings.site_name);
            }
            if (data.settings.navbar_color) {
              setNavbarColor(data.settings.navbar_color);
            }
          }
        } catch (error) {
          console.warn('Navbar: Error loading website settings on login:', error);
        }
      };

      // Load menu visibility settings
      const loadMenuVisibility = async () => {
        try {
          const data = await getMenuVisibility();
          
          if (data.success && data.settings) {
            setMenuVisibility(data.settings);
          }
        } catch (error) {
          console.warn('Navbar: Error loading menu visibility:', error);
        }
      };
      
      loadWebsiteSettings();
      loadMenuVisibility();
    } else {
      // Reset menu visibility when user logs out
      setMenuVisibility({});
    }
  }, [authUser]);

  const handleLogout = async () => {
    try {
      // Clear local state immediately
      setShowProfileDropdown(false);
      
      // Call signOut from auth context
      await signOut();
      
      // Force clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('redirect-after-reload');
      
      // Reset website settings to default
      setWebsiteLogo('');
      setSiteName('e-BizCard');
      setMenuVisibility({});
      
      // Use router.push instead of window.location.href to prevent refresh
      router.push('/');
      
    } catch (error) {
      console.error('🚪 Navbar: Error during logout:', error);
      // Force logout even if there's an error
      localStorage.removeItem('user');
      localStorage.removeItem('redirect-after-reload');
      
      // Reset website settings to default
      setWebsiteLogo('');
      setSiteName('e-BizCard');
      setMenuVisibility({});
      
      // Use router.push instead of window.location.href
      router.push('/');
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Function to handle menu item clicks
  const handleMenuClick = (path: string) => {
    // If user is not logged in and trying to access protected routes
    if (!user && (path === '/dashboard' || path === '/theme-customization')) {
      router.push('/auth/login');
      return;
    }
    
    // Otherwise, navigate to the requested path
    router.push(path);
  };

  const allMenuItems = [
    { name: 'Home', path: '/', icon: Home, key: 'home' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { name: 'Theme', path: '/theme-customization', icon: Palette, key: 'theme-customization' },
  ];

  // Filter menu items based on visibility settings
  const menuItems = allMenuItems.filter(item => {
    // Always show Home
    if (item.key === 'home') return true;
    
    // Check visibility for other menu items
    return menuVisibility[item.key] !== false;
  });

  // Helper function to check if color is white or light
  const isLightColor = (color: string): boolean => {
    if (!color) return false;
    const normalized = color.toLowerCase().trim();
    
    // Check for common white color formats
    if (normalized === '#ffffff' || normalized === '#fff' || normalized === 'white' || normalized === 'rgb(255, 255, 255)') {
      return true;
    }
    
    // Check hex color brightness
    if (normalized.startsWith('#')) {
      const hex = normalized.replace('#', '');
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
      
      // Calculate brightness (0-255)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // Consider colors with brightness > 200 as light
      return brightness > 200;
    }
    
    return false;
  };

  const isNavbarFontLight = isLightColor(navbarFontColor || '#000000');

  return (
    <nav 
      className="shadow-sm border-b border-gray-200 sticky top-0 z-50"
      style={{
        background: navbarColor?.startsWith('linear-gradient')
          ? navbarColor
          : navbarColor || '#ffffff',
        color: navbarFontColor || '#000000',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              {websiteLogo ? (
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                  <img 
                    src={websiteLogo} 
                    alt={siteName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to default logo if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center';
                      fallback.innerHTML = '<span class="text-white font-bold text-sm">E</span>';
                      (e.target as HTMLImageElement).parentElement?.appendChild(fallback);
                    }}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
              )}
              <span className="text-xl font-bold" style={{ color: navbarFontColor || '#000000' }}>{siteName}</span>
            </button>
          </div>

          {/* Center Section - Main Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActiveItem = isActive(item.path);
              // Determine color based on state
              // If font is light and item is active, use black
              // Otherwise use navbar font color (will change to black on hover if font is light)
              const buttonColor = (isNavbarFontLight && isActiveItem)
                ? '#000000' // Black for active when font is light
                : navbarFontColor || '#000000';
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleMenuClick(item.path)}
                  style={{
                    color: buttonColor,
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                    isActiveItem
                      ? isNavbarFontLight
                        ? 'bg-white'
                        : 'bg-blue-50'
                      : isNavbarFontLight
                        ? 'hover:bg-white'
                        : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={(e) => {
                    if (isNavbarFontLight && !isActiveItem) {
                      e.currentTarget.style.color = '#000000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isNavbarFontLight && !isActiveItem) {
                      e.currentTarget.style.color = navbarFontColor || '#000000';
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Section - Profile */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    isNavbarFontLight
                      ? 'hover:bg-white'
                      : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={(e) => {
                    if (isNavbarFontLight) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      const textSpan = e.currentTarget.querySelector('span');
                      if (textSpan) {
                        (textSpan as HTMLElement).style.color = '#000000';
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isNavbarFontLight) {
                      e.currentTarget.style.backgroundColor = '';
                      const textSpan = e.currentTarget.querySelector('span');
                      if (textSpan) {
                        (textSpan as HTMLElement).style.color = navbarFontColor || '#000000';
                      }
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // ถ้าโหลดรูปไม่ได้ ให้แสดงตัวอักษรแทน
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <span 
                    className="hidden sm:block text-sm font-medium" 
                    style={{ color: navbarFontColor || '#000000' }}
                  >
                    {user.full_name || user.email}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.role && (
                          <span className={`text-xs px-2 py-1 rounded inline-block font-medium ${
                            user.role === 'owner' 
                              ? 'text-red-600 bg-red-50' 
                              : user.role === 'admin'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-600 bg-gray-50'
                          }`}>
                            {user.role === 'owner' ? '👑 Owner' : 
                             user.role === 'admin' ? '👨‍💼 Admin' : 
                             '👤 User'}
                          </span>
                        )}
                        {userPlan && (
                          <span className={`text-xs px-2 py-1 rounded inline-block font-medium ${
                            userRole === 'admin' || userRole === 'owner'
                              ? 'text-purple-600 bg-purple-50'
                              : userPlan === 'Pro'
                              ? 'text-purple-600 bg-purple-50'
                              : userPlan === 'Standard'
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-600 bg-gray-50'
                          }`}>
                            {userRole === 'admin' || userRole === 'owner' 
                              ? '💎 Pro (Admin)' 
                              : userPlan === 'Pro'
                              ? '💎 Pro'
                              : userPlan === 'Standard'
                              ? '⭐ Standard'
                              : '🆓 Free'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="py-1">
                      {/* Admin Settings Link for Owner/Admin */}
                      {(userRole === 'owner' || userRole === 'admin') && (
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            router.push('/admin');
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Admin Settings
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          router.push('/settings');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/auth/login')}
                className="btn-primary"
              >
                เข้าสู่ระบบ
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActiveItem = isActive(item.path);
                // Determine color based on state
                const buttonColor = isNavbarFontLight && isActiveItem
                  ? '#000000' // Black for active when font is light
                  : navbarFontColor || '#000000';
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      handleMenuClick(item.path);
                      setShowMobileMenu(false);
                    }}
                    style={{
                      color: buttonColor,
                    }}
                    className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveItem
                        ? isNavbarFontLight
                          ? 'bg-white'
                          : 'bg-blue-50'
                        : isNavbarFontLight
                          ? 'hover:bg-white'
                          : 'hover:bg-gray-50'
                    }`}
                    onMouseEnter={(e) => {
                      if (isNavbarFontLight && !isActiveItem) {
                        e.currentTarget.style.color = '#000000';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isNavbarFontLight && !isActiveItem) {
                        e.currentTarget.style.color = navbarFontColor || '#000000';
                      }
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile dropdown */}
      {showProfileDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </nav>
  );
};
