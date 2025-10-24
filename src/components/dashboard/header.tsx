"use client"

import React from "react"
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

// Utility to get user display name
function getUserDisplayName(user?: { name?: string; username?: string; email?: string }) {
  if (!user) return 'User';
  if (user.name && user.name.trim().length > 0) return user.name;
  if (user.username && user.username.trim().length > 0) return user.username;
  if (user.email && user.email.trim().length > 0) return user.email.split('@')[0];
  return 'User';
}

// Dummy user data
const dummyUser = {
  name: 'John Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  avatar: ''
};

interface HeaderProps {
  title?: string;
  description?: string;
  logout: () => void;
}

function HeaderComponent({ title, description, logout }: HeaderProps) {
  const user = dummyUser;

  // Generate title and description if not provided
  const headerTitle = title || `Welcome, ${getUserDisplayName(user)}!`;
  const headerDescription = description || "Track your progress here, You almost reach your goal.";

  return (
    <div className="flex items-start justify-between w-full mb-3 sm:mb-4 lg:mb-6 sm:flex-row sm:items-start sm:justify-between flex-col items-start gap-3">
      <div className="flex items-center gap-4">
        <div className="rounded-full flex items-center justify-center bg-gradient-to-r from-dashboard-primary to-purple-500 shadow-lg w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 hidden sm:block">
          <TrendingUp className="text-white w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          {/* Avatar for mobile only */}
          <span className="inline-flex items-center ml-2 sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={getUserDisplayName(user ?? undefined)} />
                    <AvatarFallback className="text-white bg-dashboard-primary">
                      {getUserInitials(user?.username, user?.name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]" align="end" forceMount>
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
                <AvatarImage src={user?.avatar} alt={getUserDisplayName(user ?? undefined)} />
                <AvatarFallback className="text-white bg-dashboard-primary">
                  {getUserInitials(user?.username, user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]" align="end" forceMount>
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
