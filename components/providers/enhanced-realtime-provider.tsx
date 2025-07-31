'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useNotificationSound } from '@/lib/hooks/use-notification-sound'
import { useTranslation } from '@/lib/i18n/context'

interface EnhancedRealtimeContextType {
  unreadMessagesCount: number
  unreadNotificationsCount: number
  isOnline: boolean
  refreshCounts: () => Promise<void>
  playSound: (type: 'success' | 'info' | 'warning' | 'error') => void
}

const EnhancedRealtimeContext = createContext<EnhancedRealtimeContextType>({
  unreadMessagesCount: 0,
  unreadNotificationsCount: 0,
  isOnline: true,
  refreshCounts: async () => {},
  playSound: () => {}
})

export function useEnhancedRealtime() {
  return useContext(EnhancedRealtimeContext)
}

interface EnhancedRealtimeProviderProps {
  children: React.ReactNode
  userId: string
}

export function EnhancedRealtimeProvider({ children, userId }: EnhancedRealtimeProviderProps) {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const { playNotificationSound } = useNotificationSound()
  const { t } = useTranslation()
  const supabase = createClient()

  const refreshCounts = useCallback(async () => {
    try {
      // Refresh message count avec gestion d'erreur robuste
      try {
        const messageResponse = await fetch('/api/conversations/unread-count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (messageResponse.ok) {
          const data = await messageResponse.json()
          setUnreadMessagesCount(data.count || 0)
        } else {
          // API existe mais erreur (probablement tables manquantes)
          console.log('Conversations API error:', messageResponse.status)
          setUnreadMessagesCount(0)
        }
      } catch (messageError) {
        // Erreur réseau ou API non disponible
        if (process.env.NODE_ENV === 'development') {
          console.log('Conversations feature not available:', messageError.message)
        }
        setUnreadMessagesCount(0)
      }

      // Refresh notification count avec gestion d'erreur
      try {
        const notificationResponse = await fetch('/api/notifications/unread-count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (notificationResponse.ok) {
          const data = await notificationResponse.json()
          setUnreadNotificationsCount(data.count || 0)
        } else {
          console.log('Notifications API error:', notificationResponse.status)
          setUnreadNotificationsCount(0)
        }
      } catch (notificationError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Notifications API error:', notificationError.message)
        }
        setUnreadNotificationsCount(0)
      }
      
    } catch (error) {
      // Erreur générale - ne pas faire planter l'app
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to refresh counts:', error)
      }
      // Réinitialiser les compteurs en cas d'erreur
      setUnreadMessagesCount(0)
      setUnreadNotificationsCount(0)
    }
  }, [])

  const playSound = useCallback((type: 'success' | 'info' | 'warning' | 'error') => {
    playNotificationSound(type)
  }, [playNotificationSound])

  useEffect(() => {
    // Initial counts fetch
    refreshCounts()

    // Set up polling for message counts (every 5 seconds)
    const messagePollingInterval = setInterval(refreshCounts, 5000)

    // Cleanup polling on unmount
    return () => {
      clearInterval(messagePollingInterval)
    }
  }, [refreshCounts])

  useEffect(() => {

    // Set up real-time subscription for task notifications
    const notificationsSubscription = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const newNotification = payload.new as any
          
          console.log('🔔 Real-time notification received:', newNotification)
          
          // Determine notification type and sound
          const notificationType = newNotification.type || 'info'
          const isTaskNotification = newNotification.link?.includes('/tasks/')
          
          // Play sound based on notification type
          playNotificationSound(notificationType as any)
          
          // Update unread count immediately
          setUnreadNotificationsCount(prev => prev + 1)
          
          // Show enhanced toast notification
          const toastOptions: any = {
            description: newNotification.message,
            duration: 6000, // Show for 6 seconds
            action: newNotification.link ? {
              label: t('notifications.view'),
              onClick: () => {
                window.location.href = newNotification.link
              }
            } : undefined
          }

          // Different toast styles based on type
          switch (notificationType) {
            case 'success':
              toast.success(newNotification.title, toastOptions)
              break
            case 'warning':
              toast.warning(newNotification.title, toastOptions)
              break
            case 'error':
              toast.error(newNotification.title, toastOptions)
              break
            default:
              toast.info(newNotification.title, toastOptions)
          }

          // Enhanced browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id,
              badge: '/favicon.ico',
              requireInteraction: isTaskNotification, // Keep task notifications visible longer
              silent: false // Allow system sound
            })

            notification.onclick = () => {
              window.focus()
              if (newNotification.link) {
                window.location.href = newNotification.link
              }
              notification.close()
            }

            // Auto-close after 8 seconds for non-task notifications
            if (!isTaskNotification) {
              setTimeout(() => notification.close(), 8000)
            }
          }

          // Trigger page refresh for sidebar badge updates
          // This ensures the red dot appears immediately
          window.dispatchEvent(new CustomEvent('notification-received', {
            detail: { type: notificationType, count: unreadNotificationsCount + 1 }
          }))
        }
      )
      .subscribe()

    // Conversations system temporarily disabled to prevent infinite loops
    console.log('Conversations system temporarily disabled')

    // Monitor online status
    const handleOnline = () => {
      setIsOnline(true)
      refreshCounts() // Refresh counts when coming back online
    }
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('🔔 Notifications enabled!', {
            description: 'You\'ll now receive instant notifications for tasks and messages.'
          })
        }
      })
    }

    // Set up periodic refresh (every 30 seconds as backup)
    const refreshInterval = setInterval(refreshCounts, 30000)

    return () => {
      notificationsSubscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(refreshInterval)
    }
  }, [userId, supabase, refreshCounts, playNotificationSound])

  return (
    <EnhancedRealtimeContext.Provider value={{
      unreadMessagesCount,
      unreadNotificationsCount,
      isOnline,
      refreshCounts,
      playSound
    }}>
      {children}
    </EnhancedRealtimeContext.Provider>
  )
}