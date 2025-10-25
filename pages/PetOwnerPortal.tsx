import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Search, MapPin, Heart, Users, Bell, Plus, Home,
  PawPrint, Activity, AlertCircle, Brain, Printer, History,
  Camera, FileText, Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useColorTheme } from '@/contexts/ColorThemeContext';


import PetProfileCard from '@/components/petowner/PetProfileCard';
import AddPetModal from '@/components/petowner/AddPetModal';
import PetMedicalRecords from '@/components/petowner/PetMedicalRecords';
import { UnifiedPhotoUpload } from '@/components/UnifiedPhotoUpload';
import SearchHistory from '@/components/petowner/SearchHistory';
import MatchingAlerts from '@/components/petowner/MatchingAlerts';
import ResourceCenter from '@/components/petowner/ResourceCenter';
import AutomatedAlerts from '@/components/petowner/AutomatedAlerts';

interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  status: 'safe' | 'lost' | 'found';
  lost_date?: string;
  lost_location?: string;
  primary_photo_url?: string;
  microchip_number?: string;
}
export default function PetOwnerPortal() {
  const { toast } = useToast();
  const { colors } = useColorTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
  const [selectedPetForMedical, setSelectedPetForMedical] = useState<PetProfile | null>(null);
  const [selectedPetForPhotos, setSelectedPetForPhotos] = useState<PetProfile | null>(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pet_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      // Ensure pets is always an array
      setPets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPet = (pet: PetProfile) => {
    setEditingPet(pet);
    setShowAddPetModal(true);
  };

  const handleDeletePet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pet?')) return;
    
    try {
      const { error } = await supabase.from('pet_profiles').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Pet profile deleted' });
      fetchPets();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete pet', variant: 'destructive' });
    }
  };
  const handleStatusChange = async (id: string, status: 'safe' | 'lost' | 'found') => {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'lost') {
        updates.lost_date = new Date().toISOString();
        const location = prompt('Where was your pet last seen?');
        if (location) updates.lost_location = location;
      } else if (status === 'found') {
        updates.found_date = new Date().toISOString();
      }

      const { error } = await supabase.from('pet_profiles').update(updates).eq('id', id);
      if (error) throw error;

      await supabase.from('pet_status_history').insert([{
        pet_id: id,
        status,
        location: updates.lost_location || null,
        notes: `Status changed to ${status}`
      }]);

      toast({ title: 'Success', description: `Pet marked as ${status}` });
      fetchPets();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const stats = {
    totalPets: pets.length,
    safePets: pets.filter(p => p.status === 'safe').length,
    lostPets: pets.filter(p => p.status === 'lost').length,
    foundPets: pets.filter(p => p.status === 'found').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-50" />
      <div className="fixed inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
      }} />
      <div className="relative container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Pet Owner Portal
            </h1>
            <p className="text-gray-300 mt-1">Advanced pet management and tracking system</p>
          </div>
          <Button 
            onClick={() => { setEditingPet(null); setShowAddPetModal(true); }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Pet
          </Button>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
                  <PawPrint className="w-8 h-8 text-blue-400" />
                </div>
                <span className="text-3xl font-bold text-white">{stats.totalPets}</span>
              </div>
              <p className="text-sm text-gray-300 mt-2">Total Pets</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-500/20 rounded-lg backdrop-blur-sm">
                  <Heart className="w-8 h-8 text-green-400" />
                </div>
                <span className="text-3xl font-bold text-white">{stats.safePets}</span>
              </div>
              <p className="text-sm text-gray-300 mt-2">Safe at Home</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-red-500/20 rounded-lg backdrop-blur-sm">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <span className="text-3xl font-bold text-white">{stats.lostPets}</span>
              </div>
              <p className="text-sm text-gray-300 mt-2">Currently Lost</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-500/20 rounded-lg backdrop-blur-sm">
                  <Search className="w-8 h-8 text-purple-400" />
                </div>
                <span className="text-3xl font-bold text-white">{stats.foundPets}</span>
              </div>
              <p className="text-sm text-gray-300 mt-2">Found</p>
            </CardContent>
          </Card>
        </div>

        {stats.lostPets > 0 && (
          <Alert className="bg-red-500/10 backdrop-blur-md border border-red-500/30 shadow-xl">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              You have {stats.lostPets} pet(s) currently marked as lost. 
              Our AI-powered search network is actively scanning for matches.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full">
            <TabsTrigger value="dashboard">
              <Home className="w-4 h-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="my-pets">
              <PawPrint className="w-4 h-4 mr-2" /> My Pets
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Camera className="w-4 h-4 mr-2" /> Photos
            </TabsTrigger>
            <TabsTrigger value="medical">
              <Heart className="w-4 h-4 mr-2" /> Medical
            </TabsTrigger>
            <TabsTrigger value="search-history">
              <History className="w-4 h-4 mr-2" /> Search
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="w-4 h-4 mr-2" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="resources">
              <FileText className="w-4 h-4 mr-2" /> Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MatchingAlerts />
              <SearchHistory />
              <AutomatedAlerts />
              <ResourceCenter />
            </div>
          </TabsContent>

          <TabsContent value="my-pets" className="mt-6">
            {loading ? (
              <div className="text-center py-8 text-white">
                <div className="animate-pulse">Loading pets...</div>
              </div>
            ) : pets.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="text-center py-12">
                  <PawPrint className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-white">No pets added yet</h3>
                  <p className="text-gray-300 mb-4">Add your first pet to get started</p>
                  <Button 
                    onClick={() => setShowAddPetModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Your First Pet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pets.map(pet => (
                  <PetProfileCard
                    key={pet.id}
                    pet={pet}
                    onEdit={handleEditPet}
                    onDelete={handleDeletePet}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            {selectedPetForPhotos ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Photos for {selectedPetForPhotos.name}</h3>
                  <Button variant="outline" onClick={() => setSelectedPetForPhotos(null)}>
                    Change Pet
                  </Button>
                </div>
                <UnifiedPhotoUpload 
                  petId={selectedPetForPhotos.id} 
                  mode="multiple"
                  enableAIAnalysis={false}
                  enableMatching={false}
                  title={`Photo Gallery for ${selectedPetForPhotos.name}`}
                  description="Upload photos of your pet (max 10)"
                  maxFiles={10}
                  onUploadComplete={() => {}}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Pet</h3>
                  <p className="text-gray-600 mb-4">Choose a pet to manage photos</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {pets.map(pet => (
                      <Button 
                        key={pet.id}
                        variant="outline"
                        onClick={() => setSelectedPetForPhotos(pet)}
                      >
                        {pet.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="medical" className="mt-6">
            {selectedPetForMedical ? (
              <PetMedicalRecords 
                petId={selectedPetForMedical.id} 
                petName={selectedPetForMedical.name}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Pet</h3>
                  <p className="text-gray-600 mb-4">Choose a pet to view medical records</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {pets.map(pet => (
                      <Button 
                        key={pet.id}
                        variant="outline"
                        onClick={() => setSelectedPetForMedical(pet)}
                      >
                        {pet.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="search-history" className="mt-6">
            <SearchHistory />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MatchingAlerts />
              <AutomatedAlerts />
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <ResourceCenter />
          </TabsContent>
        </Tabs>

        <AddPetModal
          isOpen={showAddPetModal}
          onClose={() => { setShowAddPetModal(false); setEditingPet(null); }}
          onPetAdded={fetchPets}
          editingPet={editingPet}
        />
      </div>
    </div>
  );
}