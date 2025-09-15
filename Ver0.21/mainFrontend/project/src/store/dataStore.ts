import { create } from 'zustand';
import { DataSource, SavedQuery } from '@/types';
import { sqlEngine } from '@/lib/sqlEngine';
import { backendAPI, BackendDatabaseExport } from '@/lib/backendAPI';
import { toast } from 'sonner';

interface DataState {
  tables: DataSource[];
  views: SavedQuery[];
  currentQuery: string;
  queryResult: any[];
  isQueryLoading: boolean;
  isInitialized: boolean;
  backendConnected: boolean;
  syncInProgress: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
  addDataSource: (dataSource: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'> & { csvContent: string }) => Promise<void>;
  updateDataSource: (id: string, updates: Partial<DataSource> & { csvContent?: string }) => Promise<void>;
  removeDataSource: (id: string) => Promise<void>;
  executeQuery: (query: string) => Promise<any[]>;
  saveView: (name: string, query: string, description?: string) => Promise<void>;
  removeView: (id: string) => Promise<void>;
  setCurrentQuery: (query: string) => void;
  getTableSchema: (tableName: string) => Promise<Array<{name: string, type: string}>>;
  getTableData: (tableName: string, limit?: number) => Promise<any[]>;
  uploadCSVToBackend: (file: File, tableName?: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  tables: [],
  views: [],
  currentQuery: '',
  queryResult: [],
  isQueryLoading: false,
  isInitialized: false,
  backendConnected: false,
  syncInProgress: false,

  initialize: async () => {
    const state = get();
    if (state.isInitialized) return;

    try {
      console.log('🚀 Initializing data store...');
      
      // Test backend connection first
      const backendAvailable = await backendAPI.testConnection();
      set({ backendConnected: backendAvailable });
      
      if (backendAvailable) {
        console.log('✅ Backend connection established');
        toast.success('Connected to backend database');
        
        // Try to load data from backend first
        try {
          await get().loadFromBackend();
          set({ isInitialized: true });
          return;
        } catch (backendError) {
          console.warn('⚠️ Failed to load from backend, falling back to local data:', backendError);
          toast.warning('Backend sync failed, using local data');
        }
      } else {
        console.log('⚠️ Backend not available, using local SQL.js');
        toast.info('Using local database (backend not available)');
      }
      
      // Initialize SQL engine with comprehensive error handling
      try {
        await sqlEngine.initialize();
        console.log('✅ SQL engine initialized successfully');
      } catch (sqlError) {
        console.error('❌ SQL engine initialization failed:', sqlError);
        toast.error(`Database initialization failed: ${sqlError instanceof Error ? sqlError.message : 'Unknown error'}`);
        
        // Set as initialized to prevent infinite retries, but with empty data
        set({ isInitialized: true });
        return;
      }
      
      // Load sample data
      const sampleTables = [
        {
          id: '1',
          name: 'sales_data',
          type: 'csv' as const,
          columns: ['date', 'product', 'revenue', 'quantity', 'region'],
          rowCount: 5,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          csvContent: `date,product,revenue,quantity,region
2024-01-01,Product A,1200,10,North
2024-01-02,Product B,800,5,South
2024-01-03,Product A,1500,12,East
2024-01-04,Product C,2000,8,West
2024-01-05,Product B,900,6,North`
        },
        {
          id: '2',
          name: 'customer_data',
          type: 'csv' as const,
          columns: ['id', 'name', 'email', 'segment', 'lifetime_value'],
          rowCount: 5,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20'),
          csvContent: `id,name,email,segment,lifetime_value
1,John Doe,john@example.com,Premium,5000
2,Jane Smith,jane@example.com,Standard,2500
3,Bob Johnson,bob@example.com,Premium,7500
4,Alice Brown,alice@example.com,Basic,1200
5,Charlie Wilson,charlie@example.com,Standard,3000`
        }
        ,
        {
          id: '3',
          name: 'employees',
          type: 'csv' as const,
          columns: ['employee_id', 'name', 'department', 'position', 'salary', 'hire_date', 'manager_id', 'status'],
          rowCount: 15,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          csvContent: `employee_id,name,department,position,salary,hire_date,manager_id,status
1,Sarah Johnson,Sales,Sales Director,95000,2020-03-15,,Active
2,Mike Chen,Sales,Senior Sales Rep,72000,2021-06-01,1,Active
3,Lisa Rodriguez,Sales,Sales Rep,58000,2022-04-10,1,Active
4,David Kim,Marketing,Marketing Manager,78000,2020-08-20,,Active
5,Emily Davis,Marketing,Marketing Specialist,55000,2022-01-15,4,Active
6,James Wilson,HR,HR Director,88000,2019-11-05,,Active
7,Anna Thompson,HR,HR Specialist,52000,2023-02-28,6,Active
8,Robert Brown,Engineering,Engineering Manager,105000,2018-09-12,,Active
9,Maria Garcia,Engineering,Senior Developer,92000,2020-12-03,8,Active
10,Tom Anderson,Engineering,Developer,78000,2022-07-18,8,Active
11,Jennifer Lee,Finance,Finance Manager,85000,2019-05-14,,Active
12,Chris Taylor,Finance,Financial Analyst,65000,2021-10-22,11,Active
13,Nicole White,Customer Success,CS Manager,72000,2021-03-08,,Active
14,Alex Martinez,Customer Success,CS Specialist,48000,2023-01-12,13,Active
15,Kevin Parker,Sales,Sales Rep,55000,2023-06-05,1,Active`
        },
        {
          id: '11',
          name: 'employees_hr',
          type: 'csv' as const,
          columns: ['employee_id', 'name', 'department', 'position', 'hire_date', 'status', 'salary', 'performance_score', 'manager_id', 'office_location'],
          rowCount: 25,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-05'),
          csvContent: `employee_id,name,department,position,hire_date,status,salary,performance_score,manager_id,office_location
1,Alice Smith,HR,HR Manager,2018-01-15,Active,90000,4.2,,New York
2,Bob Johnson,Sales,Sales Rep,2019-03-20,Active,75000,3.8,6,Chicago
3,Charlie Brown,Marketing,Marketing Specialist,2020-07-01,Active,60000,4.0,7,Los Angeles
4,Diana Prince,Engineering,Software Engineer,2021-02-10,Active,110000,4.5,8,Austin
5,Eve Adams,HR,HR Assistant,2022-09-01,Active,55000,3.5,1,New York
6,Frank White,Sales,Sales Manager,2017-05-12,Active,100000,4.1,,Chicago
7,Grace Lee,Marketing,Marketing Manager,2020-11-01,Active,85000,4.3,,Los Angeles
8,Henry King,Engineering,Engineering Manager,2019-08-05,Active,125000,4.6,,Austin
9,Ivy Queen,HR,Recruiter,2021-06-15,Terminated,65000,3.7,1,New York
10,Jack Black,Sales,Sales Rep,2022-04-01,Terminated,70000,3.6,6,Chicago
11,Karen White,Finance,Finance Manager,2018-12-10,Active,95000,4.4,,Boston
12,Leo Brown,Finance,Financial Analyst,2020-03-22,Active,68000,3.9,11,Boston
13,Mia Davis,Customer Success,CS Manager,2019-07-18,Active,82000,4.2,,Seattle
14,Nick Wilson,Customer Success,CS Specialist,2022-11-30,Active,58000,3.8,13,Seattle
15,Olivia Taylor,Marketing,Content Creator,2023-01-12,Active,62000,3.9,7,Los Angeles
16,Paul Anderson,Engineering,Senior Developer,2020-09-25,Active,115000,4.4,8,Austin
17,Quinn Roberts,HR,HR Business Partner,2021-08-14,Active,78000,4.1,1,New York
18,Rachel Green,Sales,Account Executive,2022-02-28,Active,85000,4.0,6,Chicago
19,Sam Miller,Engineering,DevOps Engineer,2021-05-10,Active,105000,4.3,8,Austin
20,Tina Clark,Finance,Senior Analyst,2020-10-15,Active,75000,4.0,11,Boston
21,Uma Patel,Marketing,Digital Marketing Specialist,2023-03-20,Active,65000,3.7,7,Los Angeles
22,Victor Chang,Customer Success,Technical Account Manager,2021-12-05,Active,88000,4.2,13,Seattle
23,Wendy Liu,HR,People Operations Manager,2019-04-08,Active,92000,4.5,1,New York
24,Xavier Torres,Sales,Business Development Rep,2023-07-15,Active,52000,3.6,6,Chicago
25,Yara Hassan,Engineering,Quality Assurance Engineer,2022-06-12,Active,78000,3.8,8,Austin`
        },
        {
          id: '12',
          name: 'attrition_data',
          type: 'csv' as const,
          columns: ['month', 'total_employees', 'new_hires', 'terminations', 'attrition_rate', 'voluntary_terminations', 'involuntary_terminations'],
          rowCount: 12,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          csvContent: `month,total_employees,new_hires,terminations,attrition_rate,voluntary_terminations,involuntary_terminations
2023-01,95,3,2,2.1,2,0
2023-02,96,4,1,1.0,1,0
2023-03,99,5,3,3.0,2,1
2023-04,101,6,2,2.0,1,1
2023-05,105,7,3,2.9,3,0
2023-06,109,8,4,3.7,3,1
2023-07,113,6,2,1.8,2,0
2023-08,117,5,3,2.6,2,1
2023-09,119,4,2,1.7,2,0
2023-10,121,3,1,0.8,1,0
2023-11,123,2,2,1.6,1,1
2023-12,123,1,1,0.8,1,0`
        },
        {
          id: '4',
          name: 'sales_performance',
          type: 'csv' as const,
          columns: ['month', 'employee_id', 'sales_target', 'sales_actual', 'commission', 'deals_closed'],
          rowCount: 18,
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12'),
          csvContent: `month,employee_id,sales_target,sales_actual,commission,deals_closed
2024-01,2,50000,62000,3100,8
2024-01,3,40000,38000,1900,5
2024-01,15,35000,41000,2050,6
2024-02,2,50000,58000,2900,7
2024-02,3,40000,45000,2250,6
2024-02,15,35000,32000,1600,4
2024-03,2,50000,71000,3550,9
2024-03,3,40000,42000,2100,5
2024-03,15,35000,39000,1950,5
2024-04,2,50000,66000,3300,8
2024-04,3,40000,48000,2400,6
2024-04,15,35000,44000,2200,6
2024-05,2,50000,59000,2950,7
2024-05,3,40000,41000,2050,5
2024-05,15,35000,37000,1850,5
2024-06,2,50000,68000,3400,8
2024-06,3,40000,46000,2300,6
2024-06,15,35000,42000,2100,6`
        },
        {
          id: '5',
          name: 'products',
          type: 'csv' as const,
          columns: ['product_id', 'product_name', 'category', 'price', 'cost', 'launch_date', 'status'],
          rowCount: 12,
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-08'),
          csvContent: `product_id,product_name,category,price,cost,launch_date,status
1,Dashboard Pro,Software,299,89,2023-01-15,Active
2,Analytics Suite,Software,599,178,2023-03-22,Active
3,Basic Plan,Software,99,29,2022-08-10,Active
4,Enterprise License,Software,1299,389,2023-06-05,Active
5,Mobile App Add-on,Software,49,15,2023-09-12,Active
6,Training Package,Service,399,120,2023-02-28,Active
7,Support Premium,Service,199,60,2022-12-01,Active
8,Custom Integration,Service,899,270,2023-04-18,Active
9,Data Migration,Service,599,180,2023-07-30,Active
10,Consultation Hours,Service,150,45,2023-01-01,Active
11,White Label,Software,1999,599,2023-10-15,Active
12,API Access,Software,299,89,2023-11-20,Active`
        },
        {
          id: '6',
          name: 'departments',
          type: 'csv' as const,
          columns: ['department_id', 'department_name', 'budget', 'head_count', 'manager_id'],
          rowCount: 6,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-05'),
          csvContent: `department_id,department_name,budget,head_count,manager_id
1,Sales,500000,4,1
2,Marketing,350000,2,4
3,Engineering,800000,3,8
4,HR,250000,2,6
5,Finance,300000,2,11
6,Customer Success,200000,2,13`
        },
        {
          id: '7',
          name: 'marketing_campaigns',
          type: 'csv' as const,
          columns: ['campaign_id', 'campaign_name', 'start_date', 'end_date', 'budget', 'spend', 'impressions', 'clicks', 'conversions', 'channel'],
          rowCount: 10,
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-18'),
          csvContent: `campaign_id,campaign_name,start_date,end_date,budget,spend,impressions,clicks,conversions,channel
1,Q1 Product Launch,2024-01-01,2024-03-31,75000,72500,1250000,15600,234,Digital
2,Spring Email Series,2024-03-01,2024-05-31,25000,23800,0,8900,156,Email
3,Social Media Boost,2024-02-15,2024-04-15,40000,38900,890000,12400,189,Social
4,Content Marketing,2024-01-15,2024-06-15,60000,58200,0,22100,312,Content
5,PPC Campaign,2024-02-01,2024-04-30,80000,79100,2100000,28500,445,PPC
6,Webinar Series,2024-03-10,2024-05-10,30000,28900,0,4500,89,Events
7,Retargeting Campaign,2024-01-20,2024-03-20,35000,34200,750000,9800,167,Digital
8,Partnership Program,2024-02-05,2024-06-05,50000,47600,0,6700,123,Partner
9,Trade Show Booth,2024-04-15,2024-04-17,45000,44200,0,2100,78,Events
10,SEO Campaign,2024-01-01,2024-12-31,90000,30000,0,18900,278,Organic`
        },
        {
          id: '8',
          name: 'expenses',
          type: 'csv' as const,
          columns: ['expense_id', 'employee_id', 'date', 'category', 'amount', 'description', 'status'],
          rowCount: 20,
          createdAt: new Date('2024-01-22'),
          updatedAt: new Date('2024-01-22'),
          csvContent: `expense_id,employee_id,date,category,amount,description,status
1,2,2024-01-15,Travel,450.00,Client meeting - flight,Approved
2,2,2024-01-15,Meals,125.00,Client dinner,Approved
3,4,2024-01-20,Software,299.00,Design software license,Approved
4,9,2024-01-22,Training,1200.00,React conference,Approved
5,1,2024-01-25,Travel,680.00,Sales conference,Approved
6,3,2024-02-01,Meals,85.00,Team lunch,Approved
7,5,2024-02-03,Marketing,450.00,Ad spend,Approved
8,12,2024-02-05,Office,230.00,Office supplies,Approved
9,8,2024-02-08,Software,199.00,Development tools,Approved
10,6,2024-02-10,Training,800.00,HR certification,Approved
11,13,2024-02-12,Travel,320.00,Customer visit,Approved
12,4,2024-02-15,Marketing,750.00,Campaign materials,Approved
13,10,2024-02-18,Software,150.00,Code editor license,Approved
14,7,2024-02-20,Office,180.00,HR materials,Approved
15,11,2024-02-22,Travel,520.00,Finance meeting,Approved
16,14,2024-02-25,Training,350.00,Customer success training,Approved
17,15,2024-02-28,Meals,95.00,Prospect lunch,Approved
18,2,2024-03-01,Travel,380.00,Trade show travel,Pending
19,5,2024-03-03,Marketing,290.00,Social media ads,Pending
20,9,2024-03-05,Software,99.00,API testing tool,Pending`
        },
        {
          id: '9',
          name: 'customer_support_tickets',
          type: 'csv' as const,
          columns: ['ticket_id', 'customer_id', 'assigned_to', 'priority', 'status', 'category', 'created_date', 'resolved_date', 'satisfaction_score'],
          rowCount: 25,
          createdAt: new Date('2024-01-25'),
          updatedAt: new Date('2024-01-25'),
          csvContent: `ticket_id,customer_id,assigned_to,priority,status,category,created_date,resolved_date,satisfaction_score
1,1,13,High,Closed,Technical,2024-01-02,2024-01-03,5
2,2,14,Medium,Closed,Billing,2024-01-05,2024-01-06,4
3,3,13,Low,Closed,General,2024-01-08,2024-01-10,5
4,4,14,High,Closed,Technical,2024-01-12,2024-01-13,3
5,5,13,Medium,Closed,Feature Request,2024-01-15,2024-01-18,4
6,1,14,Low,Closed,General,2024-01-20,2024-01-22,5
7,2,13,High,Closed,Technical,2024-01-25,2024-01-26,4
8,3,14,Medium,Closed,Billing,2024-01-28,2024-01-30,5
9,4,13,Low,Closed,General,2024-02-01,2024-02-03,4
10,5,14,High,Closed,Technical,2024-02-05,2024-02-06,5
11,1,13,Medium,Closed,Feature Request,2024-02-08,2024-02-12,3
12,2,14,Low,Closed,General,2024-02-15,2024-02-17,4
13,3,13,High,Closed,Technical,2024-02-20,2024-02-21,5
14,4,14,Medium,Closed,Billing,2024-02-25,2024-02-26,4
15,5,13,Low,Closed,General,2024-02-28,2024-03-02,5
16,1,14,High,Open,Technical,2024-03-01,,
17,2,13,Medium,In Progress,Feature Request,2024-03-03,,
18,3,14,Low,Open,General,2024-03-05,,
19,4,13,High,In Progress,Technical,2024-03-08,,
20,5,14,Medium,Open,Billing,2024-03-10,,
21,1,13,Low,Open,General,2024-03-12,,
22,2,14,High,Open,Technical,2024-03-15,,
23,3,13,Medium,Open,Feature Request,2024-03-18,,
24,4,14,Low,Open,General,2024-03-20,,
25,5,13,High,Open,Technical,2024-03-22,,`
        },
        {
          id: '10',
          name: 'sales_territories',
          type: 'csv' as const,
          columns: ['territory_id', 'territory_name', 'region', 'sales_rep_id', 'target_revenue', 'actual_revenue', 'customer_count'],
          rowCount: 8,
          createdAt: new Date('2024-01-28'),
          updatedAt: new Date('2024-01-28'),
          csvContent: `territory_id,territory_name,region,sales_rep_id,target_revenue,actual_revenue,customer_count
1,Northeast,North,2,200000,218000,45
2,Southeast,South,3,180000,165000,38
3,Midwest,Central,15,160000,172000,42
4,Southwest,South,2,170000,189000,36
5,Northwest,West,3,150000,143000,33
6,California,West,15,250000,267000,58
7,Texas,South,2,190000,201000,41
8,Florida,South,3,175000,158000,35`
        }
      ];

      // Create tables in SQL engine
      console.log('📊 Creating sample tables...');
      for (const table of sampleTables) {
        try {
          await sqlEngine.createTableFromCSV(table.name, table.csvContent);
          console.log(`✅ Created table: ${table.name}`);
        } catch (error) {
          console.error(`❌ Failed to create table ${table.name}:`, error);
          toast.error(`Failed to create table ${table.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const sampleViews = [
        {
          id: '1',
          name: 'monthly_revenue',
          query: 'SELECT product, SUM(revenue) as total_revenue FROM sales_data GROUP BY product ORDER BY total_revenue DESC',
          description: 'Revenue by product',
          createdAt: new Date('2024-01-25')
        },
        {
          id: '2',
          name: 'employee_performance',
          query: 'SELECT e.name, e.department, sp.sales_actual, sp.commission FROM employees e JOIN sales_performance sp ON e.employee_id = sp.employee_id WHERE sp.month = "2024-06"',
          description: 'Latest employee sales performance',
          createdAt: new Date('2024-01-28')
        },
        {
          id: '3',
          name: 'department_summary',
          query: 'SELECT d.department_name, d.budget, d.head_count, AVG(e.salary) as avg_salary FROM departments d JOIN employees e ON d.department_name = e.department GROUP BY d.department_name',
          description: 'Department budgets and salary averages',
          createdAt: new Date('2024-01-30')
        },
        {
          id: '4',
          name: 'marketing_roi',
          query: 'SELECT campaign_name, budget, spend, conversions, ROUND((conversions * 1.0 / spend) * 1000, 2) as cost_per_conversion FROM marketing_campaigns WHERE conversions > 0',
          description: 'Marketing campaign ROI analysis',
          createdAt: new Date('2024-02-01')
        },
        {
          id: '5',
          name: 'support_metrics',
          query: 'SELECT status, priority, COUNT(*) as ticket_count, AVG(satisfaction_score) as avg_satisfaction FROM customer_support_tickets GROUP BY status, priority',
          description: 'Customer support ticket metrics',
          createdAt: new Date('2024-02-05')
        }
      ];

      // Create views in SQL engine
      console.log('📋 Creating sample views...');
      for (const view of sampleViews) {
        try {
          await sqlEngine.createView(view.name, view.query);
          console.log(`✅ Created view: ${view.name}`);
        } catch (error) {
          console.warn(`⚠️ Failed to create view ${view.name}:`, error);
        }
      }

      set({ 
        tables: sampleTables,
        views: sampleViews,
        isInitialized: true 
      });
      
      console.log('✅ Data store initialized successfully');
      toast.success('Database initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize data store:', error);
      toast.error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Set as initialized even if failed to prevent infinite retries
      set({ isInitialized: true });
    }
  },

  addDataSource: async (dataSource) => {
    try {
      // Ensure SQL engine is initialized
      if (!get().isInitialized) {
        await get().initialize();
      }

      const newDataSource: DataSource = {
        ...dataSource,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create table in SQL engine
      await sqlEngine.createTableFromCSV(dataSource.name, dataSource.csvContent);
      
      set(state => ({
        tables: [...state.tables, newDataSource]
      }));
    } catch (error) {
      console.error('Failed to add data source:', error);
      throw error;
    }
  },

  updateDataSource: async (id, updates) => {
    try {
      const state = get();
      const existingTable = state.tables.find(t => t.id === id);
      if (!existingTable) throw new Error('Table not found');

      // If CSV content is provided, update the table
      if (updates.csvContent) {
        await sqlEngine.createTableFromCSV(updates.name || existingTable.name, updates.csvContent);
      }

      set(state => ({
        tables: state.tables.map(t => 
          t.id === id 
            ? { ...t, ...updates, updatedAt: new Date() }
            : t
        )
      }));
    } catch (error) {
      console.error('Failed to update data source:', error);
      throw error;
    }
  },

  removeDataSource: async (id) => {
    try {
      const state = get();
      const table = state.tables.find(t => t.id === id);
      if (!table) throw new Error('Table not found');

      // Drop table from SQL engine
      await sqlEngine.dropTable(table.name);

      set(state => ({
        tables: state.tables.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error('Failed to remove data source:', error);
      throw error;
    }
  },

  executeQuery: async (query) => {
    set({ isQueryLoading: true });
    
    try {
      const result = await sqlEngine.executeQuery(query);
      set({ queryResult: result, isQueryLoading: false });
      return result;
    } catch (error) {
      set({ isQueryLoading: false });
      throw error;
    }
  },

  saveView: async (name, query, description) => {
    try {
      // Create view in SQL engine
      await sqlEngine.createView(name, query);

      const newView: SavedQuery = {
        id: Date.now().toString(),
        name,
        query,
        description,
        createdAt: new Date()
      };
      
      set(state => ({
        views: [...state.views, newView]
      }));
    } catch (error) {
      console.error('Failed to save view:', error);
      throw error;
    }
  },

  removeView: async (id) => {
    try {
      const state = get();
      const view = state.views.find(v => v.id === id);
      if (!view) throw new Error('View not found');

      // Drop view from SQL engine
      await sqlEngine.dropView(view.name);

      set(state => ({
        views: state.views.filter(v => v.id !== id)
      }));
    } catch (error) {
      console.error('Failed to remove view:', error);
      throw error;
    }
  },

  setCurrentQuery: (query) => {
    set({ currentQuery: query });
  },

  getTableSchema: async (tableName) => {
    try {
      return await sqlEngine.getTableSchema(tableName);
    } catch (error) {
      console.error('Failed to get table schema:', error);
      throw error;
    }
  },

  getTableData: async (tableName, limit = 100) => {
    try {
      return await sqlEngine.getTableData(tableName, limit);
    } catch (error) {
      console.error('Failed to get table data:', error);
      throw error;
    }
  },

  syncWithBackend: async () => {
    const state = get();
    if (!state.backendConnected) {
      throw new Error('Backend not connected');
    }

    set({ syncInProgress: true });
    try {
      console.log('🔄 Syncing with backend...');
      const syncResult = await backendAPI.syncDatabase();
      console.log('✅ Backend sync completed:', syncResult);
      toast.success(`Synced ${syncResult.total_tables} tables from backend`);
      return syncResult;
    } catch (error) {
      console.error('❌ Backend sync failed:', error);
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      set({ syncInProgress: false });
    }
  },

  loadFromBackend: async () => {
    const state = get();
    if (!state.backendConnected) {
      throw new Error('Backend not connected');
    }

    try {
      console.log('📥 Loading data from backend...');
      const exportData: BackendDatabaseExport = await backendAPI.exportDatabase();
      
      // Convert backend data to frontend format
      const tables: DataSource[] = exportData.tables.map(table => ({
        id: table.id,
        name: table.name,
        type: table.type as 'csv' | 'sql',
        columns: table.columns,
        rowCount: table.rowCount,
        createdAt: new Date(table.createdAt),
        updatedAt: new Date(table.updatedAt)
      }));

      const views: SavedQuery[] = exportData.views.map(view => ({
        id: view.id,
        name: view.name,
        query: view.query,
        description: view.description,
        createdAt: new Date(view.createdAt)
      }));

      // Load data into local SQL engine
      await sqlEngine.initialize();
      for (const table of exportData.tables) {
        try {
          await sqlEngine.createTableFromCSV(table.name, table.csvContent);
          console.log(`✅ Loaded table: ${table.name}`);
        } catch (error) {
          console.error(`❌ Failed to load table ${table.name}:`, error);
        }
      }

      set({ 
        tables,
        views,
        isInitialized: true 
      });

      console.log('✅ Data loaded from backend successfully');
      toast.success(`Loaded ${tables.length} tables and ${views.length} views from backend`);
      
    } catch (error) {
      console.error('❌ Failed to load from backend:', error);
      toast.error(`Failed to load from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },

  uploadCSVToBackend: async (file: File, tableName?: string) => {
    const state = get();
    if (!state.backendConnected) {
      throw new Error('Backend not connected');
    }

    try {
      console.log('📤 Uploading CSV to backend...');
      const result = await backendAPI.uploadCSV(file, tableName);
      console.log('✅ CSV uploaded to backend:', result);
      toast.success('CSV uploaded successfully');
      
      // Refresh data from backend
      await get().loadFromBackend();
      
    } catch (error) {
      console.error('❌ CSV upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}));