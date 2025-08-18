"use client"

import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { User, LogOut, TrendingUp } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useRouter } from "next/navigation"
import "../../styles/components/dashboard/header.css"



interface HeaderProps {
  title?: string
  description?: string
  user?: any
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function Header({ title, description, user: propUser, onRefresh, isRefreshing }: HeaderProps) {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  // Use prop user if provided, otherwise use auth user
  const user = propUser || authUser;

  const getUserInitials = (username?: string, name?: string, email?: string) => {
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (user?.username) {
      return user.username;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      // Extract name from email (before @)
      return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    }
    return 'User';
  };

  // Generate title and description if not provided
  const headerTitle = title || `Welcome, ${getUserDisplayName()}!`;
  const headerDescription = description || "Track your progress here, You almost reach your goal.";

  return (
    <div className="dashboard-header">
      <div className="dashboard-header__left">
        <div className="dashboard-header__logo-container">
          <TrendingUp className="dashboard-header__logo text-white" size={32} />
        </div>
        <div className="dashboard-header__text-container">
          <h1 className="dashboard-header__title">{headerTitle}</h1>
          <p className="dashboard-header__description">{headerDescription}</p>
        </div>
      </div>

      <div className="dashboard-header__right">
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="dashboard-header__user-button">
              <Avatar className="dashboard-header__avatar">
                <AvatarImage src={user?.avatar} alt={getUserDisplayName()} />
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
                  {getUserDisplayName()}
                </p>
                <p className="dashboard-header__email">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="dashboard-header__menu-item">
              <User className="dashboard-header__menu-icon" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="dashboard-header__menu-item dashboard-header__menu-item--danger">
              <LogOut className="dashboard-header__menu-icon" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
