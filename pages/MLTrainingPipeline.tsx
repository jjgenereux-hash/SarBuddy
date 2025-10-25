import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Database, BarChart3, FlaskConical, Settings, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { DataPreprocessor } from '@/components/ml/DataPreprocessor';
import { ModelTrainer } from '@/components/ml/ModelTrainer';
import { ModelEvaluator } from '@/components/ml/ModelEvaluator';
import { ABTestingFramework } from '@/components/ml/ABTestingFramework';
import { supabase } from '@/lib/supabase';

export default function MLTrainingPipeline() {
  const [autoRetrainEnabled, setAutoRetrainEnabled] = useState(false);
  const [performanceThreshold, setPerformanceThreshold] = useState(0.85);
  const [lastTrainingTime, setLastTrainingTime] = useState<Date | null>(null);
  const [activeModels, setActiveModels] = useState<any[]>([]);
  const [retrainingStatus, setRetrainingStatus] = useState<'idle' | 'checking' | 'retraining'>('idle');

  useEffect(() => {
    loadActiveModels();
    checkAutoRetraining();
    
    const interval = setInterval(() => {
      if (autoRetrainEnabled) {
        checkAutoRetraining();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [autoRetrainEnabled]);

  const loadActiveModels = async () => {
    const { data } = await supabase
      .from('ml_models')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    setActiveModels(data || []);
  };

  const checkAutoRetraining = async () => {
    if (!autoRetrainEnabled) return;
    
    setRetrainingStatus('checking');
    
    // Check if any active model is below threshold
    const needsRetraining = activeModels.some(model => 
      model.accuracy < performanceThreshold
    );

    if (needsRetraining) {
      setRetrainingStatus('retraining');
      await triggerRetraining();
    }
    
    setRetrainingStatus('idle');
  };

  const triggerRetraining = async () => {
    // Create a new training job
    await supabase.from('ml_training_jobs').insert({
      status: 'pending',
      started_at: new Date().toISOString()
    });
    
    setLastTrainingTime(new Date());
    
    // In a real implementation, this would trigger the actual training pipeline
    setTimeout(() => {
      loadActiveModels();
    }, 5000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            ML Training Pipeline
          </h1>
          <p className="text-muted-foreground mt-1">
            Continuously improve pet matching accuracy with automated machine learning
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={retrainingStatus === 'idle' ? 'outline' : 'default'}>
            {retrainingStatus === 'checking' && 'Checking Performance...'}
            {retrainingStatus === 'retraining' && 'Retraining Models...'}
            {retrainingStatus === 'idle' && 'System Idle'}
          </Badge>
          <Button
            variant={autoRetrainEnabled ? 'default' : 'outline'}
            onClick={() => setAutoRetrainEnabled(!autoRetrainEnabled)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRetrainEnabled ? 'animate-spin' : ''}`} />
            {autoRetrainEnabled ? 'Auto-Retrain ON' : 'Auto-Retrain OFF'}
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeModels.length}</div>
            <p className="text-sm text-muted-foreground">Active Models</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {activeModels[0]?.accuracy ? (activeModels[0].accuracy * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-sm text-muted-foreground">Best Accuracy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(performanceThreshold * 100).toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground">Threshold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {lastTrainingTime ? 
                `${Math.floor((Date.now() - lastTrainingTime.getTime()) / 3600000)}h ago` : 
                'Never'
              }
            </div>
            <p className="text-sm text-muted-foreground">Last Training</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Retrain Settings */}
      {autoRetrainEnabled && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Automatic retraining is enabled. Models will retrain when accuracy drops below {(performanceThreshold * 100).toFixed(0)}%
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm">Threshold:</span>
                <input
                  type="range"
                  min="70"
                  max="95"
                  value={performanceThreshold * 100}
                  onChange={(e) => setPerformanceThreshold(Number(e.target.value) / 100)}
                  className="w-32"
                />
                <span className="text-sm font-mono">{(performanceThreshold * 100).toFixed(0)}%</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Pipeline Tabs */}
      <Tabs defaultValue="preprocess" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="preprocess" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Preprocess
          </TabsTrigger>
          <TabsTrigger value="train" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Train
          </TabsTrigger>
          <TabsTrigger value="evaluate" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Evaluate
          </TabsTrigger>
          <TabsTrigger value="abtest" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            A/B Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preprocess" className="space-y-4">
          <DataPreprocessor />
        </TabsContent>

        <TabsContent value="train" className="space-y-4">
          <ModelTrainer />
        </TabsContent>

        <TabsContent value="evaluate" className="space-y-4">
          <ModelEvaluator />
        </TabsContent>

        <TabsContent value="abtest" className="space-y-4">
          <ABTestingFramework />
        </TabsContent>
      </Tabs>

      {/* Model Performance Alerts */}
      {activeModels.some(m => m.accuracy < performanceThreshold) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some models are performing below the threshold. 
            {autoRetrainEnabled ? ' Automatic retraining will begin shortly.' : ' Enable auto-retrain or manually retrain models.'}
          </AlertDescription>
        </Alert>
      )}

      {activeModels.every(m => m.accuracy >= 0.9) && activeModels.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All models are performing excellently with accuracy above 90%.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}