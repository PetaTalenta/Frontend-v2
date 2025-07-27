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
import { User, LogOut, Settings } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useRouter } from "next/navigation"



interface HeaderProps {
  title: string
  description: string
}

export function Header({ title, description }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

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

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-[#6475e9] rounded-full flex items-center justify-center">
          <img
            src="/placeholder-icon-logo.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#1e1e1e]">{title}</h1>
          <p className="text-[#64707d] text-sx mt-1">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} alt={getUserDisplayName()} />
                <AvatarFallback className="bg-[#6475e9] text-white">
                  {getUserInitials(user?.username, user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
