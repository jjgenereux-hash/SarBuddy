import { useState, useEffect } from 'react';
import { Search, Filter, Brain, History, Star, TrendingUp, MapPin, Clock, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdvancedSearchFilters from '@/components/search/AdvancedSearchFilters';
import SavedSearches from '@/components/search/SavedSearches';
import SearchHistory from '@/components/search/SearchHistory';
import AISearchSuggestions from '@/components/search/AISearchSuggestions';
import { useToast } from '@/hooks/use-toast';

const mockPets = [
  {
    id: '1',
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    color: 'Golden',
    size: 'large',
    status: 'lost',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68e5b3f003022de7cea64f11_1761326454986_a7d8801c.webp',
    lastSeenDate: new Date().toISOString(),
    lastSeenLocation: 'Central Park',
    description: 'Friendly golden retriever, responds to Max',
    contactPhone: '555-0123',
    distance: '0.5 miles'
  },
  {
    id: '2',
    name: 'Luna',
    species: 'dog',
    breed: 'Labrador',
    color: 'Black',
    size: 'large',
    status: 'found',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68e5b3f003022de7cea64f11_1761326456798_ef4875eb.webp',
    lastSeenDate: new Date(Date.now() - 86400000).toISOString(),
    lastSeenLocation: 'Oak Street',
    description: 'Black Labrador found near Oak Street',
    contactPhone: '555-0124',
    distance: '1.2 miles'
  },
  {
    id: '3',
    name: 'Charlie',
    species: 'dog',
    breed: 'Beagle',
    color: 'Brown and White',
    size: 'medium',
    status: 'lost',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68e5b3f003022de7cea64f11_1761326458612_ee46879c.webp',
    lastSeenDate: new Date(Date.now() - 10800000).toISOString(),
    lastSeenLocation: 'Riverside Park',
    description: 'Beagle, very friendly, wearing blue collar',
    contactPhone: '555-0125',
    distance: '2.1 miles'
  },
  {
    id: '4',
    name: 'Bella',
    species: 'dog',
    breed: 'German Shepherd',
    color: 'Black and Tan',
    size: 'large',
    status: 'lost',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68e5b3f003022de7cea64f11_1761326460447_cd6a01ad.webp',
    lastSeenDate: new Date(Date.now() - 7200000).toISOString(),
    lastSeenLocation: 'Downtown Area',
    description: 'German Shepherd, trained, has ID tag',
    contactPhone: '555-0126',
    distance: '0.8 miles'
  },
  {
    id: '5',
    name: 'Cooper',
    species: 'dog',
    breed: 'Poodle',
    color: 'White',
    size: 'medium',
    status: 'found',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68e5b3f003022de7cea64f11_1761326462217_6170d846.webp',
    lastSeenDate: new Date(Date.now() - 3600000).toISOString(),
    lastSeenLocation: 'City Park',
    description: 'White poodle found in City Park',
    contactPhone: '555-0127',
    distance: '1.5 miles'
  },
  {
    id: '6',
    name: 'Rocky',
    species: 'dog',
    breed: 'Bulldog',
    color: 'Brindle',
    size: 'medium',
    status: 'lost',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/68e5b3f003022de7cea64f11_1761326464237_3ca7eabe.webp',
    lastSeenDate: new Date(Date.now() - 14400000).toISOString(),
    lastSeenLocation: 'West Side',
    description: 'Bulldog with distinctive markings',
    contactPhone: '555-0128',
    distance: '3.2 miles'
  }
];

export default function AdvancedSearch() {
  const [searchResults, setSearchResults] = useState<any[]>(mockPets);
  const [filteredResults, setFilteredResults] = useState<any[]>(mockPets);
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [searchStats] = useState({
    totalSearches: 1247,
    successRate: 68,
    avgTimeToFind: 3.2,
    activeSearches: 42
  });
  const { toast } = useToast();

  const performSearch = (filters: any) => {
    setLoading(true);
    setCurrentFilters(filters);
    
    setTimeout(() => {
      let results = [...mockPets];
      
      if (filters.species) {
        results = results.filter(pet => pet.species === filters.species);
      }
      if (filters.status) {
        results = results.filter(pet => pet.status === filters.status);
      }
      if (filters.size) {
        results = results.filter(pet => pet.size === filters.size);
      }
      if (filters.query) {
        const query = filters.query.toLowerCase();
        results = results.filter(pet => 
          pet.name.toLowerCase().includes(query) ||
          pet.breed.toLowerCase().includes(query) ||
          pet.description.toLowerCase().includes(query)
        );
      }
      
      setFilteredResults(results);
      setLoading(false);
      
      toast({
        title: 'Search Complete',
        description: `Found ${results.length} matching pets`
      });
    }, 500);
  };

  const handleResetFilters = () => {
    setCurrentFilters({});
    setFilteredResults(mockPets);
    toast({
      title: 'Filters Reset',
      description: 'Showing all available pets'
    });
  };

  const handleLoadSavedSearch = (criteria: any) => {
    performSearch(criteria);
  };

  const handleRerunSearch = (query: string, filters: any) => {
    performSearch({ ...filters, query });
  };

  const handleApplySuggestion = (suggestion: string) => {
    performSearch({ ...currentFilters, query: suggestion });
  };

  const handleContactOwner = (phone: string) => {
    toast({
      title: 'Contact Information',
      description: `Call ${phone} to report this pet`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Pet Search
          </h1>
          <p className="text-gray-600">
            Use our AI-powered search system to find missing pets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Searches', value: searchStats.totalSearches, icon: Search, color: 'blue' },
            { label: 'Success Rate', value: `${searchStats.successRate}%`, icon: TrendingUp, color: 'green' },
            { label: 'Avg. Time', value: `${searchStats.avgTimeToFind} days`, icon: History, color: 'purple' },
            { label: 'Active', value: searchStats.activeSearches, icon: Brain, color: 'orange' }
          ].map((stat, idx) => (
            <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 text-${stat.color}-500 opacity-30`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <AdvancedSearchFilters 
              onSearch={performSearch}
              onReset={handleResetFilters}
            />
            <AISearchSuggestions
              currentSearch={currentFilters.query}
              petType={currentFilters.species}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span>Search Results</span>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {filteredResults.length} pets found
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : filteredResults.length === 0 ? (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                      No pets found. Try adjusting your filters or using AI suggestions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {filteredResults.map((pet) => (
                        <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-all">
                          <div className="flex">
                            <img 
                              src={pet.imageUrl} 
                              alt={pet.name}
                              className="w-32 h-32 object-cover"
                            />
                            <div className="flex-1 p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="text-lg font-bold">{pet.name}</h3>
                                  <p className="text-sm text-gray-600">{pet.breed}</p>
                                </div>
                                <Badge className={pet.status === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                                  {pet.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 mb-3">{pet.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {pet.lastSeenLocation} • {pet.distance}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(pet.lastSeenDate).toLocaleDateString()}
                                </span>
                              </div>
                              <Button 
                                onClick={() => handleContactOwner(pet.contactPhone)}
                                className="mt-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                                size="sm"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="saved" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger value="saved" className="data-[state=active]:bg-white">
                  <Star className="mr-2 h-4 w-4" />
                  Saved Searches
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-white">
                  <History className="mr-2 h-4 w-4" />
                  Search History
                </TabsTrigger>
              </TabsList>
              <TabsContent value="saved">
                <SavedSearches
                  currentFilters={currentFilters}
                  onLoadSearch={handleLoadSavedSearch}
                />
              </TabsContent>
              <TabsContent value="history">
                <SearchHistory onRerunSearch={handleRerunSearch} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}