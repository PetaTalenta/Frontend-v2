"use client"

import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { TrendingUp, LogOut } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"

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

interface HeaderProps {
  title?: string;
  description?: string;
  logout: () => void;
}

export default function Header({ title, description, logout }: HeaderProps) {
  const { user } = useAuth();

  // Generate title and description if not provided
  const headerTitle = title || `Welcome, ${getUserDisplayName(user ?? undefined)}!`;
  const headerDescription = description || "Track your progress here, You almost reach your goal.";

  return (
    <div className="dashboard-header">
      <div className="dashboard-header__left">
        <div className="dashboard-header__logo-container">
          <TrendingUp className="dashboard-header__logo text-white" size={32} />
        </div>
        <div className="dashboard-header__text-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Avatar for mobile only, hide on desktop with CSS */}
          <span className="dashboard-header__avatar-mobile-wrapper">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="dashboard-header__user-button">
                  <Avatar className="dashboard-header__avatar">
                    <AvatarImage src={user?.avatar} alt={getUserDisplayName(user ?? undefined)} />
                    <AvatarFallback className="dashboard-header__avatar-fallback">
                      {getUserInitials(user?.username, user?.name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dashboard-header__dropdown" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="dashboard-header__user-info">
                    <p className="dashboard-header__username">
                      {getUserDisplayName(user ?? undefined)}
                    </p>
                    <p className="dashboard-header__email">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="dashboard-header__menu-item dashboard-header__menu-item--danger">
                  <LogOut className="dashboard-header__menu-icon" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
          <div style={{ flex: 1 }}>
            <h1 className="dashboard-header__title">{headerTitle}</h1>
            <p className="dashboard-header__description">{headerDescription}</p>
          </div>
        </div>
      </div>
      {/* Avatar for desktop only, hide on mobile with CSS */}
      <div className="dashboard-header__right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="dashboard-header__user-button">
              <Avatar className="dashboard-header__avatar">
                <AvatarImage src={user?.avatar} alt={getUserDisplayName(user ?? undefined)} />
                <AvatarFallback className="dashboard-header__avatar-fallback">
                  {getUserInitials(user?.username, user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="dashboard-header__dropdown" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="dashboard-header__user-info">
                <p className="dashboard-header__username">
                  {getUserDisplayName(user ?? undefined)}
                </p>
                <p className="dashboard-header__email">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="dashboard-header__menu-item dashboard-header__menu-item--danger">
              <LogOut className="dashboard-header__menu-icon" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
// (Removed duplicate/old code and stray returns. Only the valid export default function remains above.)
