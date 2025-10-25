import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoutProfile } from '@/components/scouts/ScoutProfile';
import { TaskList } from '@/components/scouts/TaskList';
import { RewardsStore } from '@/components/scouts/RewardsStore';
import { ScheduleCalendar } from '@/components/scouts/ScheduleCalendar';
import { TimeTracker } from '@/components/scouts/TimeTracker';
import { HoursReport } from '@/components/scouts/HoursReport';
import { ScoutLeaderboard } from '@/components/scouts/ScoutLeaderboard';
import { BadgeShowcase } from '@/components/scouts/BadgeShowcase';
import { PointsTracker } from '@/components/scouts/PointsTracker';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useColorTheme } from '@/contexts/ColorThemeContext';
import { GeofenceManager } from '@/components/GeofenceManager';
import { AlertCenter } from '@/components/scouts/AlertCenter';
import LiveTracker from '@/components/tracking/LiveTracker';
import AISearchAssistant from '@/components/ai/AISearchAssistant';
import ARSearchView from '@/components/ai/ARSearchView';
import SearchPatternVisualizer from '@/components/ai/SearchPatternVisualizer';
import { 
  Users, Calendar, Award, MapPin, Bell, Shield, Clock, 
  FileText, TrendingUp, Heart, Trophy, Star, Coins, Brain, Camera
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ScoutPortal() {
  const { colors } = useColorTheme();
  const [scout, setScout] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [signedUpTasks, setSignedUpTasks] = useState<string[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [currentPet, setCurrentPet] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchPattern, setSearchPattern] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadScoutData();
    loadTasks();
    loadRewards();
    getCurrentLocation();
    loadMockPetData();
  }, []);

  const loadScoutData = async () => {
    // Simulated data for demo
    const mockScout = {
      id: '1',
      name: 'Sarah Mitchell',
      points: 2450,
      level: 'Silver Scout',
      pets_found: 12,
      searches_completed: 47
    };
    setScout(mockScout);
  };

  const loadTasks = async () => {
    const { data } = await supabase.from('scout_tasks').select('*').eq('status', 'open').order('start_time', { ascending: true });
    if (data) setTasks(data.map(task => ({...task, requirements: task.requirements || [], equipment_needed: task.equipment_needed || []})));
  };

  const loadRewards = async () => {
    const { data } = await supabase.from('scout_rewards').select('*').eq('is_active', true).order('points_required', { ascending: true });
    if (data) setRewards(data);
  };

  const loadSignups = async (scoutId: string) => {
    const { data } = await supabase.from('scout_signups').select('task_id').eq('scout_id', scoutId);
    if (data) setSignedUpTasks(data.map(s => s.task_id));
  };

  const loadAvailability = async (scoutId: string) => {
    const { data } = await supabase.from('scout_availability').select('*').eq('scout_id', scoutId).eq('is_active', true);
    if (data) setAvailability(data);
  };

  const handleTaskSignUp = async (taskId: string) => {
    if (!scout) return;
    const { error } = await supabase.from('scout_signups').insert({scout_id: scout.id, task_id: taskId, status: 'confirmed'});
    if (!error) {
      setSignedUpTasks([...signedUpTasks, taskId]);
      toast({title: "Success!", description: "You've been signed up for this task."});
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    if (!scout) return;
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || scout.points < reward.points_required) return;
    const { error } = await supabase.from('scout_reward_claims').insert({scout_id: scout.id, reward_id: rewardId, points_spent: reward.points_required});
    if (!error) {
      setScout({...scout, points: scout.points - reward.points_required});
      toast({title: "Reward Claimed!", description: `You've successfully claimed ${reward.title}`});
    }
  };

  const handleAddAvailability = async (day: Date, startTime: string, endTime: string) => {
    if (!scout) return;
    const { error } = await supabase.from('scout_availability').insert({scout_id: scout.id, day_of_week: day.getDay(), start_time: startTime, end_time: endTime});
    if (!error) {
      loadAvailability(scout.id);
      toast({title: "Availability Added", description: "Your availability has been updated."});
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation({ lat: 41.8240, lng: -71.4128 });
        }
      );
    }
  };

  const loadMockPetData = () => {
    setCurrentPet({
      id: '1',
      name: 'Max',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: '3 years',
      lastSeenLocation: 'Wayland Square Park',
      description: 'Friendly golden retriever, wearing blue collar',
      photo: '/api/placeholder/400/300'
    });
  };

  const handleSearchPatternUpdate = (pattern: any) => {
    setSearchPattern(pattern);
    if (pattern.predictions) {
      setPredictions(pattern.predictions);
    }
  };

  if (!scout) return <div className={`flex items-center justify-center h-screen bg-${colors.background}`}><div className={`text-2xl font-bold text-${colors.accent}`}>Loading...</div></div>;

  const stats = [
    { label: 'Total Points', value: scout.points.toLocaleString(), icon: Coins, color: 'from-yellow-500 to-amber-500' },
    { label: 'Pets Found', value: scout.pets_found, icon: Heart, color: 'from-rose-500 to-red-500' },
    { label: 'Current Rank', value: scout.level, icon: Award, color: 'from-purple-500 to-indigo-500' },
    { label: 'Searches', value: scout.searches_completed, icon: TrendingUp, color: 'from-blue-500 to-cyan-500' }
  ];

  return (
    <div className={`min-h-screen bg-${colors.background}`}>
      <div className={`bg-gradient-to-r ${colors.primary} text-white`}>
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-10 h-10" />
            <h1 className="text-5xl font-black">Scout Recognition Portal</h1>
          </div>
          <p className="text-xl opacity-90">Track your impact, earn rewards, and compete with fellow scouts</p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <Card key={i} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
              <div className={`h-2 bg-gradient-to-r ${stat.color}`} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black text-gray-800">{stat.value}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>


        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="w-full bg-white shadow-lg p-2 rounded-2xl grid grid-cols-3 lg:grid-cols-7 xl:grid-cols-14 gap-2">
            {[
              { value: 'dashboard', icon: Trophy, label: 'Dashboard' },
              { value: 'ai-assistant', icon: Brain, label: 'AI Assistant' },
              { value: 'ar-search', icon: Camera, label: 'AR Search' },
              { value: 'profile', icon: Users, label: 'Profile' },
              { value: 'points', icon: Coins, label: 'Points' },
              { value: 'badges', icon: Star, label: 'Badges' },
              { value: 'leaderboard', icon: Trophy, label: 'Leaders' },
              { value: 'rewards', icon: Award, label: 'Rewards' },
              { value: 'timetracker', icon: Clock, label: 'Time' },
              { value: 'report', icon: FileText, label: 'Report' },
              { value: 'alerts', icon: Bell, label: 'Alerts' },
              { value: 'tracking', icon: MapPin, label: 'Track' },
              { value: 'tasks', icon: Clock, label: 'Tasks' },
              { value: 'schedule', icon: Calendar, label: 'Schedule' }
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className={`data-[state=active]:bg-gradient-to-r data-[state=active]:${colors.primary} data-[state=active]:text-white font-semibold rounded-xl transition-all`}>

                <tab.icon className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScoutLeaderboard />
                <BadgeShowcase />
              </div>
            </TabsContent>
            <TabsContent value="ai-assistant">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <AISearchAssistant 
                    petInfo={currentPet}
                    currentLocation={currentLocation || { lat: 41.8240, lng: -71.4128 }}
                    onSearchPatternUpdate={handleSearchPatternUpdate}
                  />
                  <SearchPatternVisualizer
                    pattern={searchPattern || { type: 'grid' }}
                    centerPoint={currentLocation || { lat: 41.8240, lng: -71.4128 }}
                    searchRadius={500}
                  />
                </div>
                <div>
                  <ARSearchView
                    predictions={predictions}
                    currentLocation={currentLocation || { lat: 41.8240, lng: -71.4128 }}
                    petInfo={currentPet}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="ar-search">
              <ARSearchView
                predictions={predictions}
                currentLocation={currentLocation || { lat: 41.8240, lng: -71.4128 }}
                petInfo={currentPet}
              />
            </TabsContent>
            <TabsContent value="profile"><ScoutProfile isOwnProfile={true} /></TabsContent>
            <TabsContent value="points"><PointsTracker /></TabsContent>
            <TabsContent value="badges"><BadgeShowcase /></TabsContent>
            <TabsContent value="leaderboard"><ScoutLeaderboard /></TabsContent>
            <TabsContent value="rewards"><RewardsStore /></TabsContent>
            <TabsContent value="timetracker"><TimeTracker scoutId={scout.id} /></TabsContent>
            <TabsContent value="report"><HoursReport scoutId={scout.id} /></TabsContent>
            <TabsContent value="alerts"><AlertCenter scoutId={scout.id} /></TabsContent>
            <TabsContent value="tracking"><LiveTracker /></TabsContent>
            <TabsContent value="tasks"><TaskList tasks={tasks} onSignUp={handleTaskSignUp} signedUpTasks={signedUpTasks} /></TabsContent>
            <TabsContent value="schedule">
              <ScheduleCalendar availability={availability} tasks={tasks.filter(t => signedUpTasks.includes(t.id))} onAddAvailability={handleAddAvailability} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}