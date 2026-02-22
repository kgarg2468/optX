-- OptX Initial Database Schema

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'other',
  size TEXT NOT NULL DEFAULT '1-5',
  monthly_revenue JSONB DEFAULT '[]'::jsonb,
  expenses JSONB DEFAULT '[]'::jsonb,
  cash_on_hand NUMERIC DEFAULT 0,
  outstanding_debt NUMERIC DEFAULT 0,
  revenue_trend TEXT,
  revenue_trend_rate NUMERIC,
  customer_count INTEGER,
  avg_transaction_size NUMERIC,
  gross_margin NUMERIC,
  seasonal_patterns JSONB,
  planned_changes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data Sources
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  tier TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  manual_data JSONB,
  nlp_description TEXT,
  parsed_variables JSONB,
  accuracy_impact NUMERIC DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  graph_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Simulation Results
CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  config JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  monte_carlo JSONB,
  bayesian_network JSONB,
  sensitivity JSONB,
  backtest JSONB,
  agent_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES simulation_results(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  financial JSONB,
  narrative JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  context_scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  context_simulation_id UUID REFERENCES simulation_results(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_data_sources_business_id ON data_sources(business_id);
CREATE INDEX idx_scenarios_business_id ON scenarios(business_id);
CREATE INDEX idx_simulation_results_business_id ON simulation_results(business_id);
CREATE INDEX idx_reports_simulation_id ON reports(simulation_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
