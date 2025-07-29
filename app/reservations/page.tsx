'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n/context';
import { 
  Plus, 
  Calendar, 
  List, 
  BarChart3, 
  Building2, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MapPin,
  Sparkles
} from 'lucide-react';
import ReservationCalendar from '@/components/reservations/reservation-calendar';
import ReservationFormHybrid from '@/components/reservations/reservation-form-hybrid';
import AvailabilityManager from '@/components/reservations/availability-manager';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function ReservationsPage() {
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);

  const handleReservationSelect = (reservation: any) => {
    setSelectedReservation(reservation);
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setSelectedDates({ start, end });
    setShowCreateForm(true);
  };

  const handleCreateSuccess = (reservation: any) => {
    setShowCreateForm(false);
    setSelectedDates(null);
    // Refresh calendar data
    window.location.reload();
  };

  // Mock data for professional demo
  const stats = [
    {
      title: t('reservations.analytics.totalReservations'),
      value: '247',
      change: '+12%',
      trend: 'up',
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      title: t('reservations.analytics.monthlyRevenue'),
      value: '€18,420',
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: t('reservations.analytics.occupancyRate'),
      value: '87%',
      change: '+5.1%',
      trend: 'up',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      title: t('reservations.analytics.guestSatisfaction'),
      value: '4.8',
      change: '+0.3',
      trend: 'up',
      icon: Star,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {t('reservations.title')}
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t('reservations.description')}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('reservations.create')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-gray-500">{t('reservations.analytics.vsLastMonth')}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50/20 pointer-events-none" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="calendar" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
              <TabsTrigger 
                value="calendar" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Calendar className="h-4 w-4" />
                {t('reservations.tabs.calendar')}
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <List className="h-4 w-4" />
                {t('reservations.tabs.list')}
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                {t('reservations.tabs.analytics')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Calendar */}
              <div className="xl:col-span-2">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <CardTitle className="flex items-center gap-3">
                      <Calendar className="h-5 w-5" />
                      {t('reservations.calendar.title')}
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {t('reservations.liveView')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ReservationCalendar
                      onReservationSelect={handleReservationSelect}
                      onDateSelect={handleDateSelect}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      {t('reservations.quickActions')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('reservations.newReservation')}
                    </Button>
                    <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50">
                      <Users className="h-4 w-4 mr-2" />
                      {t('reservations.manageGuests')}
                    </Button>
                    <Button variant="outline" className="w-full border-purple-200 hover:bg-purple-50">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t('reservations.viewReports')}
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-600" />
                      {t('reservations.recentActivity')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { action: t('reservations.activities.newReservation'), guest: 'Sarah Johnson', time: t('reservations.activities.minAgo'), status: 'confirmed' },
                      { action: t('reservations.activities.checkinCompleted'), guest: 'Mike Chen', time: t('reservations.activities.hourAgo'), status: 'completed' },
                      { action: t('reservations.activities.bookingCancelled'), guest: 'Emma Wilson', time: t('reservations.activities.hoursAgo'), status: 'cancelled' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                        <div className={`p-1.5 rounded-full ${
                          activity.status === 'confirmed' ? 'bg-green-100' :
                          activity.status === 'completed' ? 'bg-blue-100' : 'bg-red-100'
                        }`}>
                          {activity.status === 'confirmed' ? <CheckCircle className="h-3 w-3 text-green-600" /> :
                           activity.status === 'completed' ? <Calendar className="h-3 w-3 text-blue-600" /> :
                           <AlertCircle className="h-3 w-3 text-red-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.guest} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Availability Management */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  {t('reservations.availabilityManagement')}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {t('reservations.proTools')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AvailabilityManager
                  lofts={[]} // This would be fetched from API
                  onUpdate={() => window.location.reload()}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <List className="h-5 w-5" />
                  {t('reservations.list.title')}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Coming Soon
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <List className="h-12 w-12 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Advanced List View</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Comprehensive reservation management with advanced filtering, sorting, and bulk operations.
                  </p>
                  <div className="flex justify-center gap-2 pt-4">
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">Advanced Filters</Badge>
                    <Badge variant="outline" className="border-teal-200 text-teal-700">Bulk Actions</Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">Export Options</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            {/* Enhanced Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: t('reservations.analytics.totalReservations'), value: '247', change: '+12%', icon: Calendar, color: 'from-blue-600 to-indigo-600' },
                { title: 'Total Revenue', value: '€18,420', change: '+8.2%', icon: TrendingUp, color: 'from-green-600 to-emerald-600' },
                { title: t('reservations.analytics.occupancyRate'), value: '87%', change: '+5.1%', icon: Building2, color: 'from-purple-600 to-pink-600' },
                { title: 'Average Stay', value: '3.2', change: '+0.4', icon: Clock, color: 'from-orange-600 to-red-600' }
              ].map((metric, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                        <metric.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        {metric.change}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                      <p className="text-xs text-gray-500">{t('reservations.analytics.vsLastMonth')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Advanced Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Chart Placeholder */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Analytics
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      Pro
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Advanced Revenue Tracking</h3>
                    <p className="text-gray-600">
                      Comprehensive revenue analytics with forecasting and trend analysis.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                      <Badge variant="outline" className="border-blue-200 text-blue-700">Forecasting</Badge>
                      <Badge variant="outline" className="border-indigo-200 text-indigo-700">Trends</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Occupancy Chart Placeholder */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <Building2 className="h-5 w-5" />
                    Occupancy Insights
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      AI Powered
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Smart Occupancy Analysis</h3>
                    <p className="text-gray-600">
                      AI-powered insights to optimize your property occupancy rates.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                      <Badge variant="outline" className="border-purple-200 text-purple-700">AI Insights</Badge>
                      <Badge variant="outline" className="border-pink-200 text-pink-700">Optimization</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5" />
                  {t('reservations.analytics.title')}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Enterprise
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-12">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-16 w-16 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Enterprise Analytics Suite</h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Comprehensive business intelligence dashboard with advanced reporting, predictive analytics, 
                      and performance optimization recommendations.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">24/7</div>
                      <div className="text-sm text-gray-600">Real-time Monitoring</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">50+</div>
                      <div className="text-sm text-gray-600">Key Metrics</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">AI</div>
                      <div className="text-sm text-gray-600">Powered Insights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">∞</div>
                      <div className="text-sm text-gray-600">Custom Reports</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Reservation Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                {t('reservations.form.title')}
              </DialogTitle>
            </DialogHeader>
            <ReservationFormHybrid
              initialCheckIn={selectedDates?.start ? selectedDates.start.toISOString().split('T')[0] : undefined}
              initialCheckOut={selectedDates?.end ? selectedDates.end.toISOString().split('T')[0] : undefined}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Reservation Details Dialog */}
        <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="max-w-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                {t('reservations.details.title')}
              </DialogTitle>
            </DialogHeader>
            {selectedReservation && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        {t('reservations.details.guest')}
                      </h4>
                      <p className="font-medium">{selectedReservation.guest_name}</p>
                      <p className="text-sm text-gray-600">{selectedReservation.guest_email}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        {t('reservations.details.dates')}
                      </h4>
                      <p className="font-medium">{selectedReservation.check_in_date} - {selectedReservation.check_out_date}</p>
                      <p className="text-sm text-gray-600">
                        {selectedReservation.nights} {t('reservations.nights')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        {t('reservations.details.loft')}
                      </h4>
                      <p className="font-medium">{selectedReservation.lofts?.name}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        {t('reservations.details.total')}
                      </h4>
                      <p className="text-2xl font-bold text-emerald-600">{selectedReservation.total_amount} DZD</p>
                    </CardContent>
                  </Card>
                </div>
                
                {selectedReservation.special_requests && (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        {t('reservations.details.specialRequests')}
                      </h4>
                      <p className="text-gray-700">{selectedReservation.special_requests}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}