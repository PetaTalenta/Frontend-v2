"use client"

import React, { useEffect, useRef, useState } from "react"
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

// Performance logging untuk validasi asumsi
const useHeaderPerformanceLogging = () => {
  const renderCount = useRef(0);
  const renderStartTime = useRef<number>(0);
  const lastRenderTime = useRef<number>(0);
  
  useEffect(() => {
    renderCount.current += 1;
    renderStartTime.current = performance.now();
    
    // DEBUG: Add detailed performance analysis
    const now = performance.now();
    const timeSinceLastRender = lastRenderTime.current ? now - lastRenderTime.current : 0;
    
    console.log(`[Header Performance DEBUG] Render #${renderCount.current} started`);
    console.log(`[Header Performance DEBUG] Time since last render: ${timeSinceLastRender.toFixed(2)}ms`);
    // DEBUG: Check memory usage if available
    if ('memory' in performance) {
      console.log(`[Header Performance DEBUG] Memory usage: ${JSON.stringify((performance as any).memory)}`);
    }
    
    // Log responsive breakpoint
    const width = window.innerWidth;
    let breakpoint = 'mobile';
    if (width >= 1024) breakpoint = 'desktop';
    else if (width >= 640) breakpoint = 'tablet';
    
    console.log(`[Header Performance] Current breakpoint: ${breakpoint} (${width}px)`);
    
    // DEBUG: Check for expensive operations
    const expensiveOperationsStart = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      const expensiveOperationsTime = performance.now() - expensiveOperationsStart;
      
      console.log(`[Header Performance] Render #${renderCount.current} completed in ${renderTime.toFixed(2)}ms`);
      console.log(`[Header Performance DEBUG] Expensive operations took: ${expensiveOperationsTime.toFixed(2)}ms`);
      
      // DEBUG: Alert on slow renders
      if (renderTime > 1000) {
        console.error(`[Header Performance CRITICAL] Slow render detected: ${renderTime.toFixed(2)}ms`);
        console.trace(`[Header Performance CRITICAL] Render stack trace for slow render #${renderCount.current}`);
      }
      
      lastRenderTime.current = now;
    };
  });
  
  return { renderCount: renderCount.current };
};

// Utility to get user initials
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

// Component to handle hydration-aware user initials
function HydrationAwareUserInitials({
  username,
  name,
  email
}: {
  username?: string;
  name?: string;
  email?: string;
}) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // During SSR and initial hydration, show placeholder to match server
  if (!isHydrated) {
    return <span className="opacity-0">?</span>;
  }

  // After hydration, show actual initials
  const initials = getUserInitials(username, name, email);
  return <span>{initials}</span>;
}

// Utility to get user display name
function getUserDisplayName(user?: {
  name?: string;
  username?: string;
  email?: string;
  displayName?: string;
  profile?: { full_name?: string };
}) {
  if (!user) return 'User';
  
  // Prioritize profile full_name
  if (user.profile?.full_name && user.profile.full_name.trim().length > 0) {
    return user.profile.full_name;
  }
  
  // Then displayName
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName;
  }
  
  // Then name
  if (user.name && user.name.trim().length > 0) {
    return user.name;
  }
  
  // Then username
  if (user.username && user.username.trim().length > 0) {
    return user.username;
  }
  
  // Finally email prefix
  if (user.email && user.email.trim().length > 0) {
    return user.email.split('@')[0];
  }
  
  return 'User';
}

// Utility functions for personalized messages
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

function HeaderComponent({
  title,
  description,
  logout,
  user,
  isLoading = false,
  dashboardStats
}: HeaderProps) {
  // Performance logging untuk validasi asumsi
  const { renderCount } = useHeaderPerformanceLogging();
  
  // Log untuk duplikasi kode analysis
  useEffect(() => {
    console.log(`[Header Analysis] User data present: ${!!user}`);
    console.log(`[Header Analysis] Dashboard stats present: ${!!dashboardStats}`);
    console.log(`[Header Analysis] Loading state: ${isLoading}`);
    
    // Log untuk menghitung jumlah dropdown yang akan dirender
    const dropdownCount = 2; // Mobile + Desktop
    console.log(`[Header Analysis] Dropdown components rendered: ${dropdownCount} (DUPLICATION ISSUE)`);
  }, [user, dashboardStats, isLoading]);

  // Generate title and description if not provided
  const displayName = getUserDisplayName(user);
  const headerTitle = title || getWelcomeMessage(displayName);
  const headerDescription = description || getProgressDescription(dashboardStats);

  // Log untuk analisis struktur layout
  useEffect(() => {
    const containerClasses = "flex items-start justify-between w-full mb-3 sm:mb-4 lg:mb-6 sm:flex-row sm:items-start sm:justify-between flex-col items-start gap-3";
    const classCount = containerClasses.split(' ').length;
    console.log(`[Header Layout Analysis] Main container has ${classCount} CSS classes (COMPLEXITY ISSUE)`);
    console.log(`[Header Layout Analysis] Nested divs count: 5+ (STRUCTURE ISSUE)`);
  }, []);

  return (
    <div className="flex items-center justify-between w-full mb-3 sm:mb-4 lg:mb-6 sm:flex-row sm:items-center sm:justify-between flex-col items-start gap-3">
      <div className="flex items-center gap-4">
        <div className="rounded-full flex items-center justify-center bg-gradient-to-r from-dashboard-primary-blue to-purple-500 shadow-lg w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 hidden sm:flex">
          <div className="flex items-center justify-center">
            <TrendingUp className="text-white w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex-shrink-0" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1">
          {/* Avatar for mobile only */}
          <span className="inline-flex items-center ml-2 sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src='' alt={getUserDisplayName(user)} />
                    <AvatarFallback className="text-white bg-dashboard-primary-blue">
                      <HydrationAwareUserInitials
                        username={user?.username}
                        name={user?.name}
                        email={user?.email}
                      />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none text-gray-900">
                      {getUserDisplayName(user ?? undefined)}
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
          </span>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 leading-tight text-xl sm:text-2xl lg:text-3xl">{headerTitle}</h1>
            <p className="text-dashboard-text-secondary leading-relaxed mt-1 text-sm">{headerDescription}</p>
          </div>
        </div>
      </div>
      {/* Avatar for desktop only */}
      <div className="flex items-center gap-4 hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 p-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src='' alt={getUserDisplayName(user)} />
                <AvatarFallback className="text-white bg-dashboard-primary-blue">
                  <HydrationAwareUserInitials
                    username={user?.username}
                    name={user?.name}
                    email={user?.email}
                  />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none text-gray-900">
                  {getUserDisplayName(user ?? undefined)}
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
      </div>
    </div>
  );
}

export default React.memo(HeaderComponent)
