"use client"

import { 
  Building2, Calendar, DollarSign, Home, LogOut, Settings, Users, 
  ClipboardList, UserCheck, ChevronDown, ChevronRight, LayoutDashboard, CreditCard, MessageSquare, Bell
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { User, UserRole } from "@/lib/types"
import { logout } from "@/lib/auth"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/ui/language-selector"
import { NotificationBadge, NotificationDot } from "@/components/ui/notification-badge"
import { useEnhancedRealtime } from "@/components/providers/enhanced-realtime-provider"
import { useNotifications } from "@/components/providers/notification-context"
import { useTranslation } from "@/lib/i18n/context"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: User;
  unreadCount: number | null;
}

export function Sidebar({ user, unreadCount, className }: SidebarProps) {
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.startsWith('/settings'))
  const { unreadMessagesCount } = useEnhancedRealtime()
  const { unreadCount: realtimeUnreadCount } = useNotifications()
  const { t } = useTranslation()

  const navigation = [
    { name: "🎯 Executive", href: "/executive", icon: LayoutDashboard, roles: ["executive"], className: "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" },
    { name: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "member"] },
    { name: t('nav.conversations'), href: "/conversations", icon: MessageSquare, roles: ["admin", "manager", "member", "executive"] },
    { name: t('nav.notifications'), href: "/notifications", icon: Bell, roles: ["admin", "manager", "member"] },
    { name: t('nav.lofts'), href: "/lofts", icon: Building2, roles: ["admin", "manager"] },
    { name: t('nav.reservations'), href: "/reservations", icon: Calendar, roles: ["admin", "manager"] },
    { name: t('nav.tasks'), href: "/tasks", icon: ClipboardList, roles: ["admin", "manager", "member"] },
    { name: t('nav.teams'), href: "/teams", icon: Users, roles: ["admin", "manager"] },
    { name: t('nav.owners'), href: "/owners", icon: UserCheck, roles: ["admin"] },
    { name: t('nav.transactions'), href: "/transactions", icon: DollarSign, roles: ["admin", "manager"] },
    { name: t('nav.reports'), href: "/reports", icon: Calendar, roles: ["admin", "manager"] },
    { 
      name: t('nav.settings'), 
      href: "/settings", 
      icon: Settings, 
      roles: ["admin", "manager"],
      subItems: [
        { name: t('nav.categories'), href: "/settings/categories", icon: ClipboardList, roles: ["admin"] },
        { name: t('nav.currencies'), href: "/settings/currencies", icon: DollarSign, roles: ["admin"] },
        { name: t('nav.zoneAreas'), href: "/settings/zone-areas", icon: Home, roles: ["admin"] },
        { name: t('nav.paymentMethods'), href: "/settings/payment-methods", icon: CreditCard, roles: ["admin"] },
        { name: t('nav.internetConnections'), href: "/settings/internet-connections", icon: Building2, roles: ["admin"] },
        { name: t('nav.application'), href: "/settings/application", icon: Settings, roles: ["admin"] }
      ]
    },
  ]

  const filteredNavigation = navigation.filter((item) => item.roles.includes(user.role))

  return (
    <div className={cn("flex h-full w-72 flex-col bg-gray-900 dark:bg-gray-900", className)}>
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-700 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center group">
          <div className="relative">
            <Building2 className="h-8 w-8 text-white transition-transform group-hover:scale-110" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-blue-500"></div>
          </div>
          <span className="ml-3 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            LoftManager
          </span>
        </Link>
        <div className="flex items-center bg-gray-700/50 dark:bg-gray-800 rounded-md p-1 gap-1">
          <LanguageSelector variant="ghost" size="sm" className="text-white hover:text-white" />
          <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-white" />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || 
                         (item.subItems && item.subItems.some(sub => pathname === sub.href))

          if (item.subItems) {
            return (
              <Collapsible 
                key={item.name}
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                className="space-y-1"
              >
                <CollapsibleTrigger className={cn(
                  "w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md",
                  isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}>
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-8 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        pathname === subItem.href ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      )}
                    >
                      <subItem.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {subItem.name}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md",
                isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
              )}
            >
              <div className="flex items-center">
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </div>
              
              {/* Real-time notification badges */}
              {item.href === "/conversations" && unreadMessagesCount > 0 && (
                <NotificationBadge count={unreadMessagesCount} className="ml-2" />
              )}
              {item.href === "/notifications" && realtimeUnreadCount > 0 && (
                <NotificationBadge count={realtimeUnreadCount} className="ml-2 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{(user.full_name || '').charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-green-500"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
            <p className="text-xs text-gray-300 capitalize">{user.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
{t('auth.signOut')}
        </Button>
      </div>
    </div>
  )
}
