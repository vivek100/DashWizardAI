-- Migration: Create dashboards table for lazy sync
-- Version: 001
-- Description: Creates the dashboards table with RLS policies for user data isolation

-- Create dashboards table
CREATE TABLE IF NOT EXISTS public.dashboards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    widgets jsonb NOT NULL DEFAULT '[]',
    is_published boolean DEFAULT false,
    is_template boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- For conflict resolution
    version integer DEFAULT 1,
    last_modified_by uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can view their own dashboards and published templates
CREATE POLICY "Users can view own dashboards and templates"
ON public.dashboards FOR SELECT
USING (
    user_id = auth.uid() OR 
    (is_template = true AND is_published = true)
);

-- Users can insert their own dashboards
CREATE POLICY "Users can insert their own dashboards"
ON public.dashboards FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own dashboards
CREATE POLICY "Users can update their own dashboards"
ON public.dashboards FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own dashboards
CREATE POLICY "Users can delete their own dashboards"
ON public.dashboards FOR DELETE
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON public.dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_templates ON public.dashboards(is_template, is_published) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_dashboards_updated ON public.dashboards(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboards_version ON public.dashboards(version);

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.version = OLD.version + 1;
    NEW.last_modified_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function
CREATE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates (HR Analytics, Sales Analytics, Customer Analytics)
-- These will be available to all users as templates

INSERT INTO public.dashboards (
    id,
    user_id,
    name,
    description,
    widgets,
    is_published,
    is_template,
    created_at,
    updated_at
) VALUES 
-- HR Analytics Template
(
    'hr-analytics-template-uuid',
    '00000000-0000-0000-0000-000000000000', -- System user UUID
    'HR Analytics Dashboard',
    'Comprehensive HR dashboard with employee metrics and attrition analysis',
    '[
        {
            "id": "hr-w1",
            "type": "metric",
            "title": "Total Active Employees",
            "position": { "x": 0, "y": 0 },
            "size": { "width": 300, "height": 200 },
            "config": { 
                "dataSource": "employees_hr", 
                "query": "SELECT COUNT(*) as total_active FROM employees_hr WHERE status = \"Active\"",
                "metricColumn": "total_active",
                "aggregationType": "count",
                "format": "number"
            }
        },
        {
            "id": "hr-w2",
            "type": "metric",
            "title": "Current Attrition Rate",
            "position": { "x": 320, "y": 0 },
            "size": { "width": 300, "height": 200 },
            "config": { 
                "dataSource": "attrition_data", 
                "query": "SELECT attrition_rate FROM attrition_data ORDER BY month DESC LIMIT 1",
                "metricColumn": "attrition_rate",
                "format": "number",
                "showTrend": true
            }
        }
    ]'::jsonb,
    true,
    true,
    now(),
    now()
),
-- Sales Analytics Template
(
    'sales-analytics-template-uuid',
    '00000000-0000-0000-0000-000000000000', -- System user UUID
    'Sales Analytics',
    'Complete sales performance dashboard with key metrics',
    '[
        {
            "id": "w1",
            "type": "metric",
            "title": "Total Revenue",
            "position": { "x": 0, "y": 0 },
            "size": { "width": 300, "height": 200 },
            "config": { 
                "dataSource": "sales_data", 
                "query": "SELECT SUM(revenue) as total_revenue FROM sales_data" 
            }
        },
        {
            "id": "w2",
            "type": "chart",
            "title": "Revenue by Product",
            "position": { "x": 320, "y": 0 },
            "size": { "width": 600, "height": 400 },
            "config": { 
                "dataSource": "sales_data", 
                "chartType": "bar",
                "query": "SELECT product, SUM(revenue) as revenue FROM sales_data GROUP BY product"
            }
        }
    ]'::jsonb,
    true,
    true,
    now(),
    now()
),
-- Customer Analytics Template
(
    'customer-analytics-template-uuid',
    '00000000-0000-0000-0000-000000000000', -- System user UUID
    'Customer Analytics',
    'Customer insights and behavior analysis dashboard',
    '[
        {
            "id": "w1",
            "type": "metric",
            "title": "Total Customers",
            "position": { "x": 0, "y": 0 },
            "size": { "width": 300, "height": 200 },
            "config": { 
                "dataSource": "customer_data", 
                "query": "SELECT COUNT(*) as total_customers FROM customer_data" 
            }
        },
        {
            "id": "w2",
            "type": "chart",
            "title": "Customer Segments",
            "position": { "x": 320, "y": 0 },
            "size": { "width": 600, "height": 400 },
            "config": { 
                "dataSource": "customer_data", 
                "chartType": "pie",
                "query": "SELECT segment, COUNT(*) as count FROM customer_data GROUP BY segment"
            }
        }
    ]'::jsonb,
    true,
    true,
    now(),
    now()
) 
ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts 