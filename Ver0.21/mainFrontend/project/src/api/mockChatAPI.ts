import { supabase } from '@/lib/supabase';
import { AIResponse } from '@/types';

// // Mock response delay (in milliseconds)
// const MOCK_RESPONSE_DELAY = 1500;

// // Mock AI responses for HR scenarios
// const mockHRResponses = {
//   'attrition rate': {
//     text: "Here's our current attrition rate with trend analysis:",
//     components: [
//       {
//         type: 'widget',
//         id: 'mock-attrition-widget',
//         data: {
//           widget: {
//             id: 'mock-metric-attrition',
//             type: 'metric',
//             title: 'Current Attrition Rate',
//             position: { x: 0, y: 0 },
//             size: { width: 350, height: 200 },
//             config: {
//               dataSource: 'attrition_data',
//               query: 'SELECT attrition_rate FROM attrition_data ORDER BY month DESC LIMIT 1',
//               metricColumn: 'attrition_rate',
//               format: 'number',
//               showTrend: true
//             }
//           },
//           showSQL: true
//         }
//       }
//     ]
//   },
//   'attrition month': {
//     text: "I'll create a line chart showing the month-over-month attrition rate trend, which will help you understand employee turnover patterns over time.",
//     components: [
//       {
//         type: 'widget',
//         id: 'mock-attrition-trend',
//         data: {
//           widget: {
//             id: 'mock-chart-attrition',
//             type: 'chart',
//             title: 'Monthly Attrition Rate Trend',
//             position: { x: 0, y: 0 },
//             size: { width: 650, height: 400 },
//             config: {
//               dataSource: 'attrition_data',
//               query: 'SELECT month, attrition_rate FROM attrition_data ORDER BY month',
//               chartType: 'line',
//               xColumn: 'month',
//               yColumn: 'attrition_rate',
//               showLabels: true,
//               showLegend: false,
//               colorScheme: 'blue',
//               format: 'number'
//             }
//           },
//           showSQL: true
//         }
//       }
//     ]
//   },
//   'employee count': {
//     text: "Here's the current active employee count from our HR database:",
//     components: [
//       {
//         type: 'widget',
//         id: 'mock-employee-count',
//         data: {
//           widget: {
//             id: 'mock-metric-employees',
//             type: 'metric',
//             title: 'Total Active Employees',
//             position: { x: 0, y: 0 },
//             size: { width: 350, height: 200 },
//             config: {
//               dataSource: 'employees_hr',
//               query: 'SELECT COUNT(*) as total_active FROM employees_hr WHERE status = "Active"',
//               metricColumn: 'total_active',
//               format: 'number',
//               showTrend: true
//             }
//           },
//           showSQL: true
//         }
//       }
//     ]
//   },
//   'salary department': {
//     text: "Here's a breakdown of average salaries across all departments for active employees:",
//     components: [
//       {
//         type: 'widget',
//         id: 'mock-salary-analysis',
//         data: {
//           widget: {
//             id: 'mock-chart-salaries',
//             type: 'chart',
//             title: 'Average Salary by Department',
//             position: { x: 0, y: 0 },
//             size: { width: 650, height: 400 },
//             config: {
//               dataSource: 'employees_hr',
//               query: 'SELECT department, AVG(salary) as avg_salary FROM employees_hr WHERE status = "Active" GROUP BY department ORDER BY avg_salary DESC',
//               chartType: 'bar',
//               xColumn: 'department',
//               yColumn: 'avg_salary',
//               format: 'currency',
//               showLabels: true,
//               showLegend: false,
//               colorScheme: 'green'
//             }
//           },
//           showSQL: true
//         }
//       }
//     ]
//   },
//   'performance score': {
//     text: "Here's an analysis of performance scores across all active employees:",
//     components: [
//       {
//         type: 'widget',
//         id: 'mock-performance-analysis',
//         data: {
//           widget: {
//             id: 'mock-chart-performance',
//             type: 'chart',
//             title: 'Performance Score Distribution by Department',
//             position: { x: 0, y: 0 },
//             size: { width: 650, height: 400 },
//             config: {
//               dataSource: 'employees_hr',
//               query: 'SELECT department, AVG(performance_score) as avg_performance FROM employees_hr WHERE status = "Active" GROUP BY department ORDER BY avg_performance DESC',
//               chartType: 'bar',
//               xColumn: 'department',
//               yColumn: 'avg_performance',
//               format: 'number',
//               showLabels: true,
//               colorScheme: 'purple'
//             }
//           },
//           showSQL: true
//         }
//       }
//     ]
//   },
//   'hr dashboard': {
//     text: "I'll create a comprehensive HR analytics dashboard with key metrics, attrition analysis, and employee insights:",
//     components: [
//       {
//         type: 'dashboard',
//         id: 'mock-hr-dashboard',
//         data: {
//           dashboard: {
//             id: 'temp-hr-dashboard',
//             name: 'HR Analytics Dashboard',
//             description: 'Comprehensive HR analytics with employee metrics and attrition tracking',
//             widgets: [
//               {
//                 id: 'hr-metric-1',
//                 type: 'metric',
//                 title: 'Total Active Employees',
//                 position: { x: 0, y: 0 },
//                 size: { width: 280, height: 160 },
//                 config: {
//                   dataSource: 'employees_hr',
//                   query: 'SELECT COUNT(*) as total_active FROM employees_hr WHERE status = "Active"',
//                   format: 'number'
//                 }
//               },
//               {
//                 id: 'hr-metric-2',
//                 type: 'metric',
//                 title: 'Current Attrition Rate',
//                 position: { x: 300, y: 0 },
//                 size: { width: 280, height: 160 },
//                 config: {
//                   dataSource: 'attrition_data',
//                   query: 'SELECT attrition_rate FROM attrition_data ORDER BY month DESC LIMIT 1',
//                   format: 'number'
//                 }
//               },
//               {
//                 id: 'hr-metric-3',
//                 type: 'metric',
//                 title: 'Avg Performance Score',
//                 position: { x: 600, y: 0 },
//                 size: { width: 280, height: 160 },
//                 config: {
//                   dataSource: 'employees_hr',
//                   query: 'SELECT AVG(performance_score) as avg_performance FROM employees_hr WHERE status = "Active"',
//                   format: 'number'
//                 }
//               },
//               {
//                 id: 'hr-chart-1',
//                 type: 'chart',
//                 title: 'Monthly Attrition Trend',
//                 position: { x: 0, y: 180 },
//                 size: { width: 580, height: 300 },
//                 config: {
//                   dataSource: 'attrition_data',
//                   query: 'SELECT month, attrition_rate FROM attrition_data ORDER BY month',
//                   chartType: 'line',
//                   colorScheme: 'blue'
//                 }
//               },
//               {
//                 id: 'hr-chart-2',
//                 type: 'chart',
//                 title: 'Average Salary by Department',
//                 position: { x: 600, y: 180 },
//                 size: { width: 580, height: 300 },
//                 config: {
//                   dataSource: 'employees_hr',
//                   query: 'SELECT department, AVG(salary) as avg_salary FROM employees_hr WHERE status = "Active" GROUP BY department',
//                   chartType: 'bar',
//                   colorScheme: 'green'
//                 }
//               },
//               {
//                 id: 'hr-table-1',
//                 type: 'table',
//                 title: 'Active Employee Directory',
//                 position: { x: 0, y: 500 },
//                 size: { width: 1180, height: 250 },
//                 config: {
//                   dataSource: 'employees_hr',
//                   query: 'SELECT name, department, position, hire_date, performance_score FROM employees_hr WHERE status = "Active" ORDER BY hire_date DESC LIMIT 15',
//                   pageSize: 15
//                 }
//               }
//             ],
//             isPublished: false,
//             isTemplate: false
//           },
//           previewMode: true
//         }
//       }
//     ],
//     actions: [
//       {
//         type: 'save_dashboard',
//         payload: { dashboardId: 'temp-hr-dashboard' }
//       }
//     ]
//   },
//   'employee list': {
//     text: "Here's the complete directory of all active employees with their key information:",
//     components: [
//       {
//         type: 'widget',
//         id: 'mock-employee-directory',
//         data: {
//           widget: {
//             id: 'mock-table-employees',
//             type: 'table',
//             title: 'Active Employee Directory',
//             position: { x: 0, y: 0 },
//             size: { width: 800, height: 450 },
//             config: {
//               dataSource: 'employees_hr',
//               query: 'SELECT name, department, position, hire_date, performance_score, office_location FROM employees_hr WHERE status = "Active" ORDER BY hire_date DESC',
//               pageSize: 15,
//               sortable: true,
//               searchable: true,
//               exportable: true,
//               showRowNumbers: true
//             }
//           },
//           showSQL: true
//         }
//       }
//     ]
//   }
// };

// // Function to match user input to mock responses
// function findMockResponse(message: string): AIResponse {
//   const lowerMessage = message.toLowerCase();
  
//   // Check for specific patterns
//   if (lowerMessage.includes('attrition') && (lowerMessage.includes('month') || lowerMessage.includes('trend'))) {
//     return mockHRResponses['attrition month'];
//   }
//   if (lowerMessage.includes('attrition')) {
//     return mockHRResponses['attrition rate'];
//   }
//   if (lowerMessage.includes('employee count') || lowerMessage.includes('how many employees')) {
//     return mockHRResponses['employee count'];
//   }
//   if (lowerMessage.includes('salary') && lowerMessage.includes('department')) {
//     return mockHRResponses['salary department'];
//   }
//   if (lowerMessage.includes('performance') && lowerMessage.includes('score')) {
//     return mockHRResponses['performance score'];
//   }
//   if (lowerMessage.includes('hr dashboard') || lowerMessage.includes('hr analytics dashboard')) {
//     return mockHRResponses['hr dashboard'];
//   }
//   if (lowerMessage.includes('employee list') || lowerMessage.includes('list of employees') || lowerMessage.includes('active employees')) {
//     return mockHRResponses['employee list'];
//   }
  
//   // Default response for unmatched queries
//   return {
//     text: "I can help you with HR analytics! Try asking about attrition rates, employee counts, salaries by department, or creating an HR dashboard.",
//     components: [
//       {
//         type: 'upload_prompt',
//         id: 'default-upload-prompt',
//         data: {
//           message: 'Upload HR data or try one of the suggested prompts below.',
//           acceptedTypes: ['.csv']
//         }
//       }
//     ]
//   };
// }

// // Simulate API delay
// function delay(ms: number): Promise<void> {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

const generateSystemPrompt = (context?: any, userMessage?: string) => {
  return `You are an intelligent Dashboard Builder AI Assistant. You help users create data visualizations, dashboards, and analyze data through natural language.

## RESPONSE FORMAT
You MUST respond with a JSON object matching this exact structure:
{
  "text": "Your conversational response text",
  "components": [/* array of component objects */],
  "actions": [/* array of action objects */]
}

## AVAILABLE CONTEXT
- tables: [${context?.tables?.join(', ') || 'none'}]
- views: [${context?.views?.join(', ') || 'none'}]
- currentDashboard: ${context?.currentDashboard?.name || 'none'}
- lastError: ${context?.lastError || 'none'}

## USER REQUEST
${userMessage}

## COMPLETE INPUT/OUTPUT EXAMPLES

### EXAMPLE 1: DASHBOARD CREATION
**Input:** "Create a comprehensive sales dashboard"
**Output:**
{
  "text": "I'll create a comprehensive sales dashboard for you with key metrics and visualizations. Here's a preview of what I'm building:",
  "components": [
    {
      "type": "dashboard",
      "id": "dashboard-preview-1",
      "data": {
        "dashboard": {
          "id": "temp-dashboard-1",
          "name": "AI Generated Sales Dashboard",
          "description": "Comprehensive sales performance dashboard with key metrics and trends",
          "widgets": [
            {
              "id": "widget-1",
              "type": "metric",
              "title": "Total Revenue",
              "position": { "x": 0, "y": 0 },
              "size": { "width": 280, "height": 160 },
              "config": {
                "dataSource": "sales_data",
                "query": "SELECT SUM(revenue) as total_revenue FROM sales_data",
                "format": "currency",
                "showTrend": true
              }
            },
            {
              "id": "widget-2",
              "type": "metric",
              "title": "Total Orders",
              "position": { "x": 300, "y": 0 },
              "size": { "width": 280, "height": 160 },
              "config": {
                "dataSource": "sales_data",
                "query": "SELECT COUNT(*) as total_orders FROM sales_data",
                "format": "number"
              }
            },
            {
              "id": "widget-3",
              "type": "chart",
              "title": "Revenue by Product",
              "position": { "x": 0, "y": 180 },
              "size": { "width": 580, "height": 300 },
              "config": {
                "dataSource": "sales_data",
                "query": "SELECT product, SUM(revenue) as revenue FROM sales_data GROUP BY product ORDER BY revenue DESC",
                "chartType": "bar",
                "colorScheme": "blue"
              }
            },
            {
              "id": "widget-4",
              "type": "table",
              "title": "Recent Sales",
              "position": { "x": 0, "y": 500 },
              "size": { "width": 580, "height": 250 },
              "config": {
                "dataSource": "sales_data",
                "query": "SELECT * FROM sales_data ORDER BY date DESC LIMIT 10",
                "pageSize": 5
              }
            }
          ],
          "isPublished": false,
          "isTemplate": false
        },
        "previewMode": true
      }
    }
  ],
  "actions": [
    {
      "type": "save_dashboard",
      "payload": { "dashboardId": "temp-dashboard-1" }
    }
  ]
}

### EXAMPLE 2: PIE CHART WIDGET
**Input:** "Create a pie chart of customer segments"
**Output:**
{
  "text": "I'll create a pie chart showing customer segments from your data. Here's how it looks:",
  "components": [
    {
      "type": "widget",
      "id": "widget-preview-pie",
      "data": {
        "widget": {
          "id": "temp-pie-widget",
          "type": "chart",
          "title": "Customer Segments Distribution",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 500, "height": 400 },
          "config": {
            "dataSource": "customer_data",
            "query": "SELECT segment, COUNT(*) as count FROM customer_data GROUP BY segment",
            "chartType": "pie",
            "showLabels": true,
            "showLegend": true,
            "colorScheme": "default"
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 3: METRIC WIDGET
**Input:** "Show me a metric for total revenue"
**Output:**
{
  "text": "I'll create a revenue metric widget with trend indicators:",
  "components": [
    {
      "type": "widget",
      "id": "widget-preview-metric",
      "data": {
        "widget": {
          "id": "temp-metric-widget",
          "type": "metric",
          "title": "Total Revenue",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 300, "height": 200 },
          "config": {
            "dataSource": "sales_data",
            "query": "SELECT SUM(revenue) as total_revenue FROM sales_data",
            "format": "currency",
            "showTrend": true,
            "targetValue": 50000,
            "comparisonPeriod": "previous"
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 4: LINE CHART WIDGET
**Input:** "Build a line chart of sales trends"
**Output:**
{
  "text": "Here's a line chart showing sales trends over time:",
  "components": [
    {
      "type": "widget",
      "id": "widget-preview-line",
      "data": {
        "widget": {
          "id": "temp-line-widget",
          "type": "chart",
          "title": "Sales Trends Over Time",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 600, "height": 350 },
          "config": {
            "dataSource": "sales_data",
            "query": "SELECT date, SUM(revenue) as daily_revenue FROM sales_data GROUP BY date ORDER BY date",
            "chartType": "line",
            "showLabels": false,
            "showLegend": false,
            "colorScheme": "green"
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 5: TABLE WIDGET
**Input:** "Show me a table of top customers"
**Output:**
{
  "text": "I'll create a table showing the top 10 customers by lifetime value:",
  "components": [
    {
      "type": "widget",
      "id": "widget-preview-table",
      "data": {
        "widget": {
          "id": "temp-table-widget",
          "type": "table",
          "title": "Top 10 Customers by Lifetime Value",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 600, "height": 400 },
          "config": {
            "dataSource": "customer_data",
            "query": "SELECT name, email, segment, lifetime_value FROM customer_data ORDER BY lifetime_value DESC LIMIT 10",
            "pageSize": 10,
            "sortable": true,
            "searchable": true
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 6: SQL QUERY RESULT
**Input:** "Show me sales data"
**Output:**
{
  "text": "Here's your sales data with the SQL query I used to fetch it:",
  "components": [
    {
      "type": "sql_result",
      "id": "sql-result-1",
      "data": {
        "query": "SELECT * FROM sales_data ORDER BY date DESC LIMIT 10",
        "result": [
          { "date": "2024-01-05", "product": "Product B", "revenue": 900, "quantity": 6, "region": "North" },
          { "date": "2024-01-04", "product": "Product C", "revenue": 2000, "quantity": 8, "region": "West" },
          { "date": "2024-01-03", "product": "Product A", "revenue": 1500, "quantity": 12, "region": "East" },
          { "date": "2024-01-02", "product": "Product B", "revenue": 800, "quantity": 5, "region": "South" },
          { "date": "2024-01-01", "product": "Product A", "revenue": 1200, "quantity": 10, "region": "North" }
        ],
        "executionTime": 23
      }
    }
  ],
  "actions": []
}

### EXAMPLE 7: AGGREGATED SQL QUERY
**Input:** "Show me top products by revenue"
**Output:**
{
  "text": "Here are your top products by revenue with the analysis:",
  "components": [
    {
      "type": "sql_result",
      "id": "sql-result-products",
      "data": {
        "query": "SELECT product, SUM(revenue) as total_revenue, SUM(quantity) as total_quantity, COUNT(*) as order_count FROM sales_data GROUP BY product ORDER BY total_revenue DESC",
        "result": [
          { "product": "Product A", "total_revenue": 2700, "total_quantity": 22, "order_count": 2 },
          { "product": "Product C", "total_revenue": 2000, "total_quantity": 8, "order_count": 1 },
          { "product": "Product B", "total_revenue": 1700, "total_quantity": 11, "order_count": 2 }
        ],
        "executionTime": 18
      }
    }
  ],
  "actions": []
}

### EXAMPLE 8: CSV UPLOAD PROMPT
**Input:** "I want to upload a CSV file"
**Output:**
{
  "text": "I can help you upload a CSV file to add new data to your dashboard. Click the button below to get started:",
  "components": [
    {
      "type": "upload_prompt",
      "id": "upload-prompt-1",
      "data": {
        "message": "Upload a CSV file to create a new data source or update existing data",
        "acceptedTypes": [".csv"],
        "targetTable": null
      }
    }
  ],
  "actions": []
}

### EXAMPLE 9: ERROR HANDLING
**Input:** "Show me data from fake_table"
**Output:**
{
  "text": "I encountered an error while trying to access that data:",
  "components": [
    {
      "type": "error",
      "id": "error-1",
      "data": {
        "error": "Table 'fake_table' doesn't exist in the database",
        "code": "TABLE_NOT_FOUND",
        "suggestions": [
          "Available tables: sales_data, customer_data",
          "Check table name spelling",
          "Upload a new CSV file to create this table"
        ]
      }
    }
  ],
  "actions": []
}

### EXAMPLE 10: MIXED RESPONSE (CHART + DATA)
**Input:** "Create a chart and show me the data"
**Output:**
{
  "text": "I'll create a revenue chart and show you the underlying data:",
  "components": [
    {
      "type": "widget",
      "id": "mixed-widget",
      "data": {
        "widget": {
          "id": "mixed-chart-widget",
          "type": "chart",
          "title": "Revenue by Product",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 500, "height": 300 },
          "config": {
            "dataSource": "sales_data",
            "query": "SELECT product, SUM(revenue) as revenue FROM sales_data GROUP BY product",
            "chartType": "bar"
          }
        },
        "showSQL": false
      }
    },
    {
      "type": "sql_result",
      "id": "mixed-data",
      "data": {
        "query": "SELECT product, SUM(revenue) as revenue FROM sales_data GROUP BY product",
        "result": [
          { "product": "Product A", "revenue": 2700 },
          { "product": "Product B", "revenue": 1700 },
          { "product": "Product C", "revenue": 2000 }
        ]
      }
    }
  ],
  "actions": []
}

### HR-SPECIFIC EXAMPLES

### EXAMPLE 11: HR EMPLOYEE COUNT
**Input:** "Show me the current employee count"
**Output:**
{
  "text": "Here's the current active employee count from our HR database:",
  "components": [
    {
      "type": "widget",
      "id": "hr-employee-count",
      "data": {
        "widget": {
          "id": "hr-metric-employees",
          "type": "metric",
          "title": "Total Active Employees",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 350, "height": 200 },
          "config": {
            "dataSource": "employees_hr",
            "query": "SELECT COUNT(*) as total_active FROM employees_hr WHERE status = 'Active'",
            "metricColumn": "total_active",
            "format": "number",
            "showTrend": true
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 12: ATTRITION RATE ANALYSIS
**Input:** "What is the attrition rate month over month?"
**Output:**
{
  "text": "Here's the monthly attrition rate trend showing how employee turnover has changed over time:",
  "components": [
    {
      "type": "widget",
      "id": "hr-attrition-trend",
      "data": {
        "widget": {
          "id": "hr-chart-attrition",
          "type": "chart",
          "title": "Monthly Attrition Rate Trend",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 650, "height": 400 },
          "config": {
            "dataSource": "attrition_data",
            "query": "SELECT month, attrition_rate, voluntary_terminations, involuntary_terminations FROM attrition_data ORDER BY month",
            "chartType": "line",
            "xColumn": "month",
            "yColumn": "attrition_rate",
            "showLabels": true,
            "showLegend": false,
            "colorScheme": "blue",
            "format": "number"
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 13: CURRENT ATTRITION RATE
**Input:** "Show me our current attrition rate"
**Output:**
{
  "text": "Here's our most recent monthly attrition rate with trend comparison:",
  "components": [
    {
      "type": "widget",
      "id": "hr-current-attrition",
      "data": {
        "widget": {
          "id": "hr-metric-attrition",
          "type": "metric",
          "title": "Current Attrition Rate",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 350, "height": 200 },
          "config": {
            "dataSource": "attrition_data",
            "query": "SELECT attrition_rate FROM attrition_data ORDER BY month DESC LIMIT 1",
            "metricColumn": "attrition_rate",
            "format": "number",
            "showTrend": true
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 14: ACTIVE EMPLOYEES LIST
**Input:** "Show me a list of all active employees"
**Output:**
{
  "text": "Here's the complete directory of all active employees with their key information:",
  "components": [
    {
      "type": "widget",
      "id": "hr-employee-directory",
      "data": {
        "widget": {
          "id": "hr-table-employees",
          "type": "table",
          "title": "Active Employee Directory",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 800, "height": 450 },
          "config": {
            "dataSource": "employees_hr",
            "query": "SELECT name, department, position, hire_date, performance_score, office_location FROM employees_hr WHERE status = 'Active' ORDER BY hire_date DESC",
            "pageSize": 15,
            "sortable": true,
            "searchable": true,
            "exportable": true,
            "showRowNumbers": true
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 15: SALARY ANALYSIS BY DEPARTMENT
**Input:** "Show me employee salaries by department"
**Output:**
{
  "text": "Here's a breakdown of average salaries across all departments for active employees:",
  "components": [
    {
      "type": "widget",
      "id": "hr-salary-analysis",
      "data": {
        "widget": {
          "id": "hr-chart-salaries",
          "type": "chart",
          "title": "Average Salary by Department",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 650, "height": 400 },
          "config": {
            "dataSource": "employees_hr",
            "query": "SELECT department, AVG(salary) as avg_salary, COUNT(*) as employee_count FROM employees_hr WHERE status = 'Active' GROUP BY department ORDER BY avg_salary DESC",
            "chartType": "bar",
            "xColumn": "department",
            "yColumn": "avg_salary",
            "format": "currency",
            "showLabels": true,
            "showLegend": false,
            "colorScheme": "green"
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 16: PERFORMANCE SCORE DISTRIBUTION
**Input:** "Show me performance scores across the company"
**Output:**
{
  "text": "Here's an analysis of performance scores across all active employees:",
  "components": [
    {
      "type": "widget",
      "id": "hr-performance-analysis",
      "data": {
        "widget": {
          "id": "hr-chart-performance",
          "type": "chart",
          "title": "Performance Score Distribution by Department",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 650, "height": 400 },
          "config": {
            "dataSource": "employees_hr",
            "query": "SELECT department, AVG(performance_score) as avg_performance, COUNT(*) as employee_count FROM employees_hr WHERE status = 'Active' GROUP BY department ORDER BY avg_performance DESC",
            "chartType": "bar",
            "xColumn": "department",
            "yColumn": "avg_performance",
            "format": "number",
            "showLabels": true,
            "colorScheme": "purple"
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 17: OFFICE LOCATION DISTRIBUTION
**Input:** "How are employees distributed across our offices?"
**Output:**
{
  "text": "Here's the distribution of active employees across all office locations:",
  "components": [
    {
      "type": "widget",
      "id": "hr-office-distribution",
      "data": {
        "widget": {
          "id": "hr-chart-offices",
          "type": "chart",
          "title": "Employee Distribution by Office Location",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 500, "height": 400 },
          "config": {
            "dataSource": "employees_hr",
            "query": "SELECT office_location, COUNT(*) as employee_count FROM employees_hr WHERE status = 'Active' GROUP BY office_location ORDER BY employee_count DESC",
            "chartType": "pie",
            "xColumn": "office_location",
            "yColumn": "employee_count",
            "showLabels": true,
            "showLegend": true,
            "colorScheme": "default"
          }
        },
        "showSQL": true
      }
    }
  ],
  "actions": []
}

### EXAMPLE 18: HR DASHBOARD CREATION
**Input:** "Create an HR analytics dashboard"
**Output:**
{
  "text": "I'll create a comprehensive HR analytics dashboard with key metrics, attrition analysis, and employee insights:",
  "components": [
    {
      "type": "dashboard",
      "id": "hr-dashboard-preview",
      "data": {
        "dashboard": {
          "id": "temp-hr-dashboard",
          "name": "HR Analytics Dashboard",
          "description": "Comprehensive HR analytics with employee metrics and attrition tracking",
          "widgets": [
            {
              "id": "hr-metric-1",
              "type": "metric",
              "title": "Total Active Employees",
              "position": { "x": 0, "y": 0 },
              "size": { "width": 280, "height": 160 },
              "config": {
                "dataSource": "employees_hr",
                "query": "SELECT COUNT(*) as total_active FROM employees_hr WHERE status = 'Active'",
                "format": "number"
              }
            },
            {
              "id": "hr-metric-2",
              "type": "metric",
              "title": "Current Attrition Rate",
              "position": { "x": 300, "y": 0 },
              "size": { "width": 280, "height": 160 },
              "config": {
                "dataSource": "attrition_data",
                "query": "SELECT attrition_rate FROM attrition_data ORDER BY month DESC LIMIT 1",
                "format": "percentage"
              }
            },
            {
              "id": "hr-metric-3",
              "type": "metric",
              "title": "Avg Performance Score",
              "position": { "x": 600, "y": 0 },
              "size": { "width": 280, "height": 160 },
              "config": {
                "dataSource": "employees_hr",
                "query": "SELECT AVG(performance_score) as avg_performance FROM employees_hr WHERE status = 'Active'",
                "format": "number"
              }
            },
            {
              "id": "hr-chart-1",
              "type": "chart",
              "title": "Monthly Attrition Trend",
              "position": { "x": 0, "y": 180 },
              "size": { "width": 580, "height": 300 },
              "config": {
                "dataSource": "attrition_data",
                "query": "SELECT month, attrition_rate FROM attrition_data ORDER BY month",
                "chartType": "line",
                "colorScheme": "blue"
              }
            },
            {
              "id": "hr-chart-2",
              "type": "chart",
              "title": "Average Salary by Department",
              "position": { "x": 600, "y": 180 },
              "size": { "width": 580, "height": 300 },
              "config": {
                "dataSource": "employees_hr",
                "query": "SELECT department, AVG(salary) as avg_salary FROM employees_hr WHERE status = 'Active' GROUP BY department",
                "chartType": "bar",
                "colorScheme": "green"
              }
            },
            {
              "id": "hr-table-1",
              "type": "table",
              "title": "Active Employee Directory",
              "position": { "x": 0, "y": 500 },
              "size": { "width": 1180, "height": 250 },
              "config": {
                "dataSource": "employees_hr",
                "query": "SELECT name, department, position, hire_date, performance_score FROM employees_hr WHERE status = 'Active' ORDER BY hire_date DESC LIMIT 15",
                "pageSize": 15
              }
            }
          ],
          "isPublished": false,
          "isTemplate": false
        },
        "previewMode": true
      }
    }
  ],
  "actions": [
    {
      "type": "save_dashboard",
      "payload": { "dashboardId": "temp-hr-dashboard" }
    }
  ]
}

### EXAMPLE 11: DEFAULT/HELP RESPONSE
**Input:** "What can you help me with?"
**Output:**
{
  "text": "I can help you create dashboards, analyze data, generate widgets, and upload CSV files. Try asking me to create specific visualizations or show you data from your tables.",
  "components": [],
  "actions": []
}

## POSITIONING RULES FOR DASHBOARDS
- Metrics Row: y: 0, x: 0, 300, 600 (3 columns)
- Charts Row: y: 180, x: 0 (full width) or x: 0, 300 (half width)  
- Tables Row: y: 500, x: 0 (full width)
- Grid Size: 20px increments
- Widget Sizes:
  - Metric: width: 280, height: 160
  - Chart: width: 500-600, height: 300-350
  - Table: width: 580-600, height: 250-400

## IMPORTANT RULES
1. ALWAYS return valid JSON - no markdown code blocks
2. Use only tables from the available context
3. Generate realistic sample data for sql_result components
4. Include appropriate executionTime (15-50ms) for SQL results
5. Use unique IDs with timestamps when possible
6. Match the exact structure shown in examples
7. For errors, provide helpful suggestions with available tables
8. Use proper SQL syntax with GROUP BY for aggregations

Remember: You are creating functional dashboard components that render immediately. Ensure all queries reference actual tables from context and all configurations are complete.`;
};

// This interface is based on what ChatInterface.tsx expects.
export interface MockChatResponse {
  text: string;
  suggestions?: string[];
  aiResponse: AIResponse;
}

export const sendChatMessage = async (message: string, context?: any): Promise<MockChatResponse> => {
  const fullPrompt = generateSystemPrompt(context, message);
  
  // // Add artificial delay to simulate thinking
  // await delay(MOCK_RESPONSE_DELAY);
  
  // // For now, use mock responses instead of real API calls
  // const aiResponse = findMockResponse(message);
  
  // // Generate contextual suggestions based on the response type
  // let suggestions: string[] = [];
  // if (aiResponse.components) {
  //   const componentTypes = aiResponse.components.map(c => c.type);
    
  //   if (componentTypes.includes('dashboard')) {
  //     suggestions = ["Save this dashboard", "Add more widgets", "Change layout", "Open in editor"];
  //   } else if (componentTypes.includes('widget')) {
  //     suggestions = ["Add to dashboard", "Modify settings", "Change chart type", "Export data"];
  //   } else if (componentTypes.includes('sql_result')) {
  //     suggestions = ["Create chart from this", "Filter data", "Export to CSV", "Save as view"];
  //   } else if (componentTypes.includes('upload_prompt')) {
  //     suggestions = ["Show me our current attrition rate", "What is the attrition rate month over month?", "Show me employee salaries by department", "Create an HR analytics dashboard"];
  //   } else if (componentTypes.includes('error')) {
  //     suggestions = ["Show available tables", "Try different query", "Upload new data", "Get help"];
  //   }
  // }

  // // Fallback suggestions if none were generated
  // if (suggestions.length === 0) {
  //   suggestions = [
  //     "Show me our current attrition rate",
  //     "What is the attrition rate month over month?", 
  //     "Show me employee salaries by department",
  //     "Create an HR analytics dashboard"
  //   ];
  // }

  // return {
  //   text: aiResponse.text,
  //   suggestions,
  //   aiResponse: aiResponse,
  // };

  // REAL API CALL CODE
  try {
    // Get the current session and access token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authenticated session found. Please log in again.');
    }

    // Prepare the request payload
    const requestPayload = {
      message: fullPrompt,
    };

    console.log('Sending request to dashboard-agent:', {
      payload: requestPayload,
      hasToken: !!session.access_token
    });
    // Make the API call with the authenticated user's token
    const { data, error } = await supabase.functions.invoke('dashboard-agent', {
      body: requestPayload,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    console.log('Dashboard-agent response:', { data, error });

    if (error) {
      console.error('Error invoking Supabase function:', error);
      // Return a structured error message that the UI can display
      return {
        text: 'Sorry, I encountered an error. Please try again.',
        aiResponse: {
          text: `Error calling dashboard agent: ${error.message}`,
          components: [
            {
              type: 'error',
              id: `error-${Date.now()}`,
              data: {
                error: error.message,
                code: 'DASHBOARD_AGENT_ERROR',
                suggestions: [
                  'Check your internet connection',
                  'Verify you are logged in',
                  'Try again in a moment',
                  'Verify dashboard-agent function is deployed'
                ]
              },
            },
          ],
        },
      };
    }

    // The edge function should return a JSON object that is already in the AIResponse format.
    const aiResponse: AIResponse = data;

    // Generate contextual suggestions based on the response type
    let suggestions: string[] = [];
    if (aiResponse.components) {
      const componentTypes = aiResponse.components.map(c => c.type);
      
      if (componentTypes.includes('dashboard')) {
        suggestions = ["Save this dashboard", "Add more widgets", "Change layout", "Open in editor"];
      } else if (componentTypes.includes('widget')) {
        suggestions = ["Add to dashboard", "Modify settings", "Change chart type", "Export data"];
      } else if (componentTypes.includes('sql_result')) {
        suggestions = ["Create chart from this", "Filter data", "Export to CSV", "Save as view"];
      } else if (componentTypes.includes('upload_prompt')) {
        suggestions = ["Upload sales data", "Upload customer data", "Show file requirements", "View existing tables"];
      } else if (componentTypes.includes('error')) {
        suggestions = ["Show available tables", "Try different query", "Upload new data", "Get help"];
      }
    }

    // Fallback suggestions if none were generated
    if (suggestions.length === 0) {
      suggestions = [
        "Create a pie chart of customer segments",
        "Show me a metric for total revenue", 
        "Build a line chart of sales trends",
        "Create a comprehensive sales dashboard"
      ];
    }

    return {
      text: aiResponse.text,
      suggestions,
      aiResponse: aiResponse,
    };
  } catch (err) {
    console.error('Network or other error calling Supabase function:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    
    // Check if it's an authentication error
    if (errorMessage.includes('session') || errorMessage.includes('auth')) {
      return {
        text: 'Your session has expired. Please log in again to continue using the AI assistant.',
        suggestions: ["Log in again", "Try demo login", "Refresh page"],
        aiResponse: {
          text: 'Authentication required to use AI features.',
          components: [
            {
              type: 'error',
              id: `error-${Date.now()}`,
              data: {
                error: 'Session expired or not authenticated',
                code: 'AUTH_REQUIRED',
                suggestions: [
                  'Please log in again',
                  'Try the demo login',
                  'Refresh the page'
                ]
              },
            },
          ],
        },
      };
    }
    
    return {
      text: 'Sorry, I encountered a network error. Please check your connection and try again.',
      suggestions: ["Try again", "Check connection", "Contact support"],
      aiResponse: {
        text: `Network error: ${errorMessage}`,
        components: [
          {
            type: 'error',
            id: `error-${Date.now()}`,
            data: {
              error: errorMessage,
              code: 'NETWORK_ERROR',
              suggestions: [
                'Check your internet connection',
                'Verify Supabase URL and keys',
                'Try refreshing the page'
              ]
            },
          },
        ],
      },
    };
  }
};