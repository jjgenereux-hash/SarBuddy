import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RecoveryTimeChart from '@/components/analytics/RecoveryTimeChart';
import SeasonalTrendsChart from '@/components/analytics/SeasonalTrendsChart';
import VolunteerMetrics from '@/components/analytics/VolunteerMetrics';
import LocationHeatmap from '@/components/analytics/LocationHeatmap';
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import AutomatedReports from '@/components/analytics/AutomatedReports';
import { 
  BarChart3, TrendingUp, Download, RefreshCw, Settings, 
  Target, Users, MapPin, Calendar, Brain, FileText,
  Plane, CheckCircle, AlertTriangle, Clock
} from 'lucide-react';
import { addDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  // KPI Goals
  const kpiGoals = [
    { name: 'Success Rate', current: 94.2, goal: 95, unit: '%', icon: CheckCircle, color: 'text-green-500' },
    { name: 'Avg Recovery Time', current: 9.5, goal: 8, unit: 'hrs', icon: Clock, color: 'text-blue-500' },
    { name: 'Volunteer Hours', current: 8245, goal: 10000, unit: '', icon: Users, color: 'text-purple-500' },
    { name: 'Drone Efficiency', current: 87, goal: 90, unit: '%', icon: Plane, color: 'text-orange-500' }
  ];

  // Drone efficiency stats
  const droneStats = {
    totalFlights: 342,
    avgFlightTime: 45,
    successfulMissions: 298,
    coverageArea: 1250,
    batteryEfficiency: 92,
    maintenanceScore: 95
  };

  const handleExportData = () => {
    console.log('Exporting comprehensive analytics data...');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive rescue analytics, predictions, and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Goals Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            KPI Goal Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {kpiGoals.map((kpi) => {
              const progress = kpi.goal > kpi.current 
                ? (kpi.current / kpi.goal) * 100 
                : (kpi.goal / kpi.current) * 100;
              const Icon = kpi.icon;
              
              return (
                <div key={kpi.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                      <span className="text-sm font-medium">{kpi.name}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 px-2">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{kpi.current}</span>
                    <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Goal: {kpi.goal}{kpi.unit}</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label>Time Range</Label>
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedTimeRange === 'custom' && (
            <div className="flex-1 min-w-[300px]">
              <Label>Custom Date Range</Label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          )}
          <div className="flex-1 min-w-[200px]">
            <Label>Region</Label>
            <Select defaultValue="all">
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="sf">San Francisco</SelectItem>
                <SelectItem value="oakland">Oakland</SelectItem>
                <SelectItem value="sj">San Jose</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="drones">Drones</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <RecoveryTimeChart timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="geographic">
          <LocationHeatmap />
        </TabsContent>

        <TabsContent value="seasonal">
          <SeasonalTrendsChart year={2024} />
        </TabsContent>

        <TabsContent value="volunteers">
          <VolunteerMetrics />
        </TabsContent>

        <TabsContent value="drones">
          <div className="space-y-6">
            {/* Drone Efficiency Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Flights</p>
                      <p className="text-2xl font-bold">{droneStats.totalFlights}</p>
                      <p className="text-sm text-green-600 mt-1">+23% this month</p>
                    </div>
                    <Plane className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">{((droneStats.successfulMissions / droneStats.totalFlights) * 100).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground mt-1">{droneStats.successfulMissions} successful</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Coverage Area</p>
                      <p className="text-2xl font-bold">{droneStats.coverageArea}</p>
                      <p className="text-sm text-muted-foreground mt-1">sq miles this month</p>
                    </div>
                    <MapPin className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Drone Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Drone Fleet Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Average Flight Time</span>
                      <span className="text-sm">{droneStats.avgFlightTime} min</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Battery Efficiency</span>
                      <span className="text-sm">{droneStats.batteryEfficiency}%</span>
                    </div>
                    <Progress value={droneStats.batteryEfficiency} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Maintenance Score</span>
                      <span className="text-sm">{droneStats.maintenanceScore}%</span>
                    </div>
                    <Progress value={droneStats.maintenanceScore} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalytics />
        </TabsContent>

        <TabsContent value="reports">
          <AutomatedReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}