'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  User,
  Home,
  Calendar
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from './ui/sidebar';
import type { Profile } from '@/src/types/biomarker';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        // Silently fail - profile is optional for sidebar
      }
    }
    loadProfile();
  }, []);

  const links = [
    {
      label: 'Dashboard',
      href: '/',
      icon: (
        <Home className="text-neutral-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Biomarkers',
      href: '/biomarkers',
      icon: (
        <Activity className="text-neutral-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Schedule',
      href: '/schedule',
      icon: (
        <Calendar className="text-neutral-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: (
        <User className="text-neutral-700 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-50 min-w-0 md:flex-row">
      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="justify-between gap-10 bg-white border-r border-gray-200" mobileBrand="VitalCare">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="text-neutral-800">
                <div className="font-semibold text-lg">VitalCare</div>
                <div className="text-xs text-neutral-500">
                  Health Analytics Dashboard
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* User Profile at Bottom */}
          <div className="border-t border-neutral-200 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
                {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-700">
                  {profile?.full_name || 'Loading...'}
                </span>
                <span className="text-xs text-neutral-500">
                  {profile ? `${profile.sex}, ${profile.age} years` : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content - min-h-0 so it can shrink and scroll in column layout on mobile */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto">
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
