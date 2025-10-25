import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VolunteerProfile } from '@/components/volunteers/VolunteerProfile';
import { TaskList } from '@/components/volunteers/TaskList';
import { RewardsStore } from '@/components/volunteers/RewardsStore';
import { ScheduleCalendar } from '@/components/volunteers/ScheduleCalendar';
import { TimeTracker } from '@/components/volunteers/TimeTracker';
import { HoursReport } from '@/components/volunteers/HoursReport';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useColorTheme } from '@/contexts/ColorThemeContext';
import { GeofenceManager } from '@/components/GeofenceManager';
import { AlertCenter } from '@/components/volunteers/AlertCenter';
import { LiveTracker } from '@/components/tracking/LiveTracker';
import { Users, Calendar, Award, MapPin, Bell, Shield, Clock, FileText, TrendingUp, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function VolunteerPortal() {
  const { colors } = useColorTheme();

  const [volunteer, setVolunteer] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [signedUpTasks, setSignedUpTasks] = useState<string[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadVolunteerData();
    loadTasks();
    loadRewards();
  }, []);

  const loadVolunteerData = async () => {
    const { data } = await supabase.from('volunteers').select('*').limit(1).single();
    if (data) {
      setVolunteer(data);
      loadSignups(data.id);
      loadAvailability(data.id);
    }
  };

  const loadTasks = async () => {
    const { data } = await supabase.from('volunteer_tasks').select('*').eq('status', 'open').order('start_time', { ascending: true });
    if (data) setTasks(data.map(task => ({...task, requirements: task.requirements || [], equipment_needed: task.equipment_needed || []})));
  };

  const loadRewards = async () => {
    const { data } = await supabase.from('volunteer_rewards').select('*').eq('is_active', true).order('points_required', { ascending: true });
    if (data) setRewards(data);
  };

  const loadSignups = async (volunteerId: string) => {
    const { data } = await supabase.from('volunteer_signups').select('task_id').eq('volunteer_id', volunteerId);
    if (data) setSignedUpTasks(data.map(s => s.task_id));
  };

  const loadAvailability = async (volunteerId: string) => {
    const { data } = await supabase.from('volunteer_availability').select('*').eq('volunteer_id', volunteerId).eq('is_active', true);
    if (data) setAvailability(data);
  };

  const handleTaskSignUp = async (taskId: string) => {
    if (!volunteer) return;
    const { error } = await supabase.from('volunteer_signups').insert({volunteer_id: volunteer.id, task_id: taskId, status: 'confirmed'});
    if (!error) {
      setSignedUpTasks([...signedUpTasks, taskId]);
      toast({title: "Success!", description: "You've been signed up for this task."});
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    if (!volunteer) return;
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || volunteer.points < reward.points_required) return;
    const { error } = await supabase.from('volunteer_reward_claims').insert({volunteer_id: volunteer.id, reward_id: rewardId, points_spent: reward.points_required});
    if (!error) {
      setVolunteer({...volunteer, points: volunteer.points - reward.points_required});
      toast({title: "Reward Claimed!", description: `You've successfully claimed ${reward.title}`});
    }
  };

  const handleAddAvailability = async (day: Date, startTime: string, endTime: string) => {
    if (!volunteer) return;
    const { error } = await supabase.from('volunteer_availability').insert({volunteer_id: volunteer.id, day_of_week: day.getDay(), start_time: startTime, end_time: endTime});
    if (!error) {
      loadAvailability(volunteer.id);
      toast({title: "Availability Added", description: "Your availability has been updated."});
    }
  };

  if (!volunteer) return <div className={`flex items-center justify-center h-screen bg-${colors.background}`}><div className={`text-2xl font-bold text-${colors.accent}`}>Loading...</div></div>;

  const stats = [
    { label: 'Active Tasks', value: signedUpTasks.length, icon: Clock, color: 'from-blue-500 to-cyan-500' },
    { label: 'Points Earned', value: volunteer.points, icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
    { label: 'Current Level', value: volunteer.level, icon: Award, color: 'from-amber-500 to-orange-500' },
    { label: 'Pets Helped', value: 24, icon: Heart, color: 'from-rose-500 to-red-500' }
  ];

  return (
    <div className={`min-h-screen bg-${colors.background}`}>
      <div className={`bg-gradient-to-r ${colors.primary} text-white`}>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-5xl font-black mb-4">Welcome back, {volunteer.name}!</h1>
          <p className="text-xl opacity-90">You're making a difference in reuniting pets with their families</p>
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
                  <span className="text-4xl font-black text-gray-800">{stat.value}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="timetracker" className="space-y-8">
          <TabsList className="w-full bg-white shadow-lg p-2 rounded-2xl grid grid-cols-5 lg:grid-cols-9 gap-2">
            {[
              { value: 'timetracker', icon: Clock, label: 'Time' },
              { value: 'report', icon: FileText, label: 'Report' },
              { value: 'alerts', icon: Bell, label: 'Alerts' },
              { value: 'tracking', icon: MapPin, label: 'Track' },
              { value: 'geofences', icon: Shield, label: 'Zones' },
              { value: 'profile', icon: Users, label: 'Profile' },
              { value: 'tasks', icon: Clock, label: 'Tasks' },
              { value: 'schedule', icon: Calendar, label: 'Schedule' },
              { value: 'rewards', icon: Award, label: 'Rewards' }
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className={`data-[state=active]:bg-gradient-to-r data-[state=active]:${colors.primary} data-[state=active]:text-white font-semibold rounded-xl transition-all`}>

                <tab.icon className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <TabsContent value="timetracker"><TimeTracker volunteerId={volunteer.id} /></TabsContent>
            <TabsContent value="report"><HoursReport volunteerId={volunteer.id} /></TabsContent>
            <TabsContent value="alerts"><AlertCenter volunteerId={volunteer.id} /></TabsContent>
            <TabsContent value="tracking">
              <LiveTracker searchPartyId="demo-party-id" volunteerId={volunteer.id} volunteerName={volunteer.name}
                assignedZone={{name: "Downtown Providence", center: {lat: 41.8240, lng: -71.4128}, radius: 1000}} />
            </TabsContent>
            <TabsContent value="geofences"><GeofenceManager volunteerId={volunteer.id} /></TabsContent>
            <TabsContent value="profile"><VolunteerProfile volunteer={volunteer} /></TabsContent>
            <TabsContent value="tasks"><TaskList tasks={tasks} onSignUp={handleTaskSignUp} signedUpTasks={signedUpTasks} /></TabsContent>
            <TabsContent value="schedule">
              <ScheduleCalendar availability={availability} tasks={tasks.filter(t => signedUpTasks.includes(t.id))} onAddAvailability={handleAddAvailability} />
            </TabsContent>
            <TabsContent value="rewards"><RewardsStore rewards={rewards} userPoints={volunteer.points} onClaim={handleClaimReward} /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}