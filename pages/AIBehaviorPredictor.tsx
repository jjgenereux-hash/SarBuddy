import React, { useState } from 'react';
import { BehaviorPredictor } from '@/components/ai/BehaviorPredictor';
import { MovementAnalyzer } from '@/components/ai/MovementAnalyzer';
import { TimePredictions } from '@/components/ai/TimePredictions';
import { WeatherImpactAnalysis } from '@/components/ai/WeatherImpactAnalysis';
import { ProbabilityMap } from '@/components/ai/ProbabilityMap';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Map, Clock, Cloud, TrendingUp, Target } from 'lucide-react';

export default function AIBehaviorPredictor() {
  const [predictions, setPredictions] = useState<any>(null);
  const [probabilityZones, setProbabilityZones] = useState<any[]>([]);
  const [lastLocation] = useState({ lat: 41.8240, lng: -71.4128 });

  const handlePrediction = (data: any) => {
    setPredictions(data.predictions);
    setProbabilityZones(data.probabilityZones || []);
  };

  // Mock weather data - in production, fetch from weather API
  const weatherData = {
    temperature: 72,
    condition: 'clear',
    wind: 10,
    humidity: 65,
    rain: false,
    clear: true
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Pet Behavior Predictor
          </h1>
          <p className="text-gray-600 text-lg">
            Advanced AI analysis to predict your pet's movement patterns and likely locations
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <BehaviorPredictor onPrediction={handlePrediction} />
          </div>
          
          <div className="lg:col-span-2">
            {predictions ? (
              <ProbabilityMap 
                center={lastLocation}
                probabilityZones={probabilityZones}
                predictions={predictions}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center p-8">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Predictions Yet
                  </h3>
                  <p className="text-gray-500">
                    Enter your pet's information and generate a behavior prediction to see the probability map
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {predictions && (
          <Tabs defaultValue="time" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Analysis
              </TabsTrigger>
              <TabsTrigger value="weather" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Weather Impact
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="time" className="mt-6">
              <TimePredictions predictions={predictions} />
            </TabsContent>

            <TabsContent value="weather" className="mt-6">
              <WeatherImpactAnalysis 
                weatherData={weatherData}
                predictions={predictions}
              />
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Behavioral Patterns
                  </h3>
                  <ul className="space-y-2">
                    {predictions.behaviorPatterns?.map((pattern: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span className="text-gray-700">{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Search Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {predictions.searchRecommendations?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Confidence Score</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                      style={{ width: `${predictions.confidence || 75}%` }}
                    />
                  </div>
                  <span className="font-bold text-lg">{predictions.confidence || 75}%</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Based on breed characteristics, environmental factors, and historical data
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Footer />
    </div>
  );
}