-- Enable RLS (Row Level Security) for all tables
-- This ensures users can only access their own data

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulations table - main entity for each simulation run
CREATE TABLE public.simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  prompt TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing_config', 'completed_config', 'processing_simulation', 'completed_simulation', 'processing_report', 'completed_report', 'failed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Config files generated from prompts
CREATE TABLE public.simulation_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  config_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raw data output from running the config
CREATE TABLE public.simulation_raw_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  step_number INT NOT NULL,
  raw_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated reports from analyzed raw data
CREATE TABLE public.simulation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  report TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_simulations_user_id ON public.simulations(user_id);
CREATE INDEX idx_simulations_status ON public.simulations(status);
CREATE INDEX idx_simulations_created_at ON public.simulations(created_at DESC);
CREATE INDEX idx_simulation_configs_simulation_id ON public.simulation_configs(simulation_id);
CREATE INDEX idx_simulation_raw_data_simulation_id ON public.simulation_raw_data(simulation_id);
CREATE INDEX idx_simulation_reports_simulation_id ON public.simulation_reports(simulation_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_raw_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Simulations: Users can only access their own simulations
CREATE POLICY "Users can view their own simulations" ON public.simulations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own simulations" ON public.simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations" ON public.simulations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations" ON public.simulations
  FOR DELETE USING (auth.uid() = user_id);

-- Simulation configs: Users can only access configs for their simulations
CREATE POLICY "Users can view their simulation configs" ON public.simulation_configs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_configs.simulation_id 
    AND simulations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their simulation configs" ON public.simulation_configs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_configs.simulation_id 
    AND simulations.user_id = auth.uid()
  ));

-- Similar policies for other tables
CREATE POLICY "Users can view their simulation raw data" ON public.simulation_raw_data
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_raw_data.simulation_id 
    AND simulations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their simulation raw data" ON public.simulation_raw_data
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_raw_data.simulation_id 
    AND simulations.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their simulation reports" ON public.simulation_reports
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_reports.simulation_id 
    AND simulations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their simulation reports" ON public.simulation_reports
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_reports.simulation_id 
    AND simulations.user_id = auth.uid()
  ));

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists before creating it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime subscriptions for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE simulations;
ALTER PUBLICATION supabase_realtime ADD TABLE simulation_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE simulation_raw_data;
ALTER PUBLICATION supabase_realtime ADD TABLE simulation_reports;