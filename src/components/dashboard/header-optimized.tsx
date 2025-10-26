"use client"

import React, { useMemo, useCallback } from "react"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "./dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { TrendingUp, LogOut } from "lucide-react"

// Utility functions (moved outside component to prevent re-creation)
function getUserInitials(username?: string, name?: string, email?: string) {
  if (name && name.trim().length > 0) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  }
  if (username && username.trim().length > 0) {
    return username[0].toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email[0].toUpperCase();
  }
  return '?';
}

function getUserDisplayName(user?: {
  name?: string;
  username?: string;
  email?: string;
  displayName?: string;
  profile?: { full_name?: string };
}) {
  if (!user) return 'User';
  
  if (user.profile?.full_name && user.profile.full_name.trim().length > 0) {
    return user.profile.full_name;
  }
  
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName;
  }
  
  if (user.name && user.name.trim().length > 0) {
    return user.name;
  }
  
  if (user.username && user.username.trim().length > 0) {
    return user.username;
  }
  
  if (user.email && user.email.trim().length > 0) {
    return user.email.split('@')[0];
  }
  
  return 'User';
}

function getWelcomeMessage(userName?: string) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Pagi' : hour < 15 ? 'Siang' : hour < 18 ? 'Sore' : 'Malam';
  const displayName = userName || 'User';
  return `Selamat ${timeOfDay}, ${displayName}!`;
}

function getProgressDescription(stats?: { completed?: number; processing?: number; tokenBalance?: number }) {
  if (!stats) return "Lacak progress Anda di sini.";
  
  const { completed = 0, processing = 0, tokenBalance = 0 } = stats;
  
  if (completed === 0) {
    return "Mulai assessment pertama Anda untuk mengetahui potensi diri.";
  } else if (processing > 0) {
    return `Anda memiliki ${processing} assessment sedang diproses.`;
  } else if (tokenBalance < 10) {
    return "Token Anda hampir habis, segera isi ulang untuk melanjutkan.";
  } else {
    return `Anda telah menyelesaikan ${completed} assessment!`;
  }
}

// Optimized dropdown component to prevent duplication
const OptimizedUserDropdown = React.memo(({ 
  user, 
  logout, 
  isMobile = false 
}: { 
  user?: any; 
  logout: () => void; 
  isMobile?: boolean;
}) => {
  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src='' alt={displayName} />
            <AvatarFallback className="text-white bg-dashboard-primary-blue">
              {getUserInitials(user?.username, user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none text-gray-900">
              {displayName}
            </p>
            <p className="text-xs leading-none text-gray-500">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="flex items-center gap-2 p-2 rounded-md transition-all duration-200 cursor-pointer text-sm text-red-600 hover:bg-red-50">
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

OptimizedUserDropdown.displayName = 'OptimizedUserDropdown';

interface HeaderProps {
  title?: string;
  description?: string;
  logout: () => void;
  user?: {
    name?: string;
    username?: string;
    email?: string;
    displayName?: string;
    profile?: {
      full_name?: string;
    };
  };
  isLoading?: boolean;
  dashboardStats?: {
    completed?: number;
    processing?: number;
    tokenBalance?: number;
  };
}

// Optimized header component with performance fixes
const OptimizedHeader = React.memo(function Header({
  title,
  description,
  logout,
  user,
  isLoading = false,
  dashboardStats
}: HeaderProps) {
  // Memoize expensive calculations
  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const headerTitle = useMemo(() => title || getWelcomeMessage(displayName), [title, displayName]);
  const headerDescription = useMemo(() => description || getProgressDescription(dashboardStats), [description, dashboardStats]);
  
  // Memoize logout callback to prevent re-creation
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="flex items-center justify-between w-full mb-3 sm:mb-4 lg:mb-6 sm:flex-row sm:items-center sm:justify-between flex-col items-start gap-3">
      <div className="flex items-center gap-4">
        <div className="rounded-full flex items-center justify-center bg-gradient-to-r from-dashboard-primary-blue to-purple-500 shadow-lg w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 hidden sm:flex">
          <div className="flex items-center justify-center">
            <TrendingUp className="text-white w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1">
          {/* Mobile dropdown - only shown on mobile */}
          <div className="sm:hidden">
            <OptimizedUserDropdown user={user} logout={handleLogout} isMobile={true} />
          </div>
          
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 leading-tight text-xl sm:text-2xl lg:text-3xl">{headerTitle}</h1>
            <p className="text-dashboard-text-secondary leading-relaxed mt-1 text-sm">{headerDescription}</p>
          </div>
        </div>
      </div>
      
      {/* Desktop dropdown - only shown on desktop */}
      <div className="hidden sm:block">
        <OptimizedUserDropdown user={user} logout={handleLogout} isMobile={false} />
      </div>
    </div>
  );
});

OptimizedHeader.displayName = 'OptimizedHeader';

export default OptimizedHeader;