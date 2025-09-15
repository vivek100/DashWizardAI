"""Report Generation Tools

Tools for creating comprehensive analysis reports and summaries.
"""

import pandas as pd
from typing import List, Dict, Any
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from .storage_tools import db_manager
from ..config import config


@tool
def generate_analysis_report(table_name: str, report_type: str = "comprehensive") -> str:
    """Generate a comprehensive analysis report for a table.
    
    Creates a detailed report with insights, statistics, and recommendations
    based on the data in the specified table.
    
    Args:
        table_name: Name of the table to analyze
        report_type: Type of report - "comprehensive", "summary", or "executive"
        
    Returns:
        Formatted analysis report with insights and recommendations
    """
    try:
        # Get table information and data
        table_info = db_manager.get_table_info(table_name)
        df = db_manager.execute_query(f"SELECT * FROM {table_name}")
        
        if len(df) == 0:
            return f"Error: Table '{table_name}' is empty."
        
        # Initialize LLM for report generation
        llm = ChatOpenAI(model=config.AGENT_SMALL_MODEL, temperature=0.2)
        
        # Gather basic statistics
        report_data = {
            "table_name": table_name,
            "description": table_info.get("description", ""),
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": df.columns.tolist(),
            "data_types": df.dtypes.to_dict(),
            "sample_data": df.head(3).to_dict('records')
        }
        
        # Calculate statistics for numerical columns
        numerical_stats = {}
        for col in df.columns:
            if df[col].dtype in ['int64', 'float64']:
                try:
                    stats = df[col].describe()
                    numerical_stats[col] = {
                        "mean": stats['mean'],
                        "median": stats['50%'],
                        "std": stats['std'],
                        "min": stats['min'],
                        "max": stats['max']
                    }
                except:
                    pass
        
        # Identify text columns with potential sentiment/theme data
        text_analysis_cols = [col for col in df.columns if 'sentiment' in col.lower() or 'theme' in col.lower()]
        
        # Generate different types of reports
        if report_type == "executive":
            prompt = f"""
            Create an executive summary report for the data analysis.
            
            Data Overview:
            - Table: {table_name}
            - Description: {report_data['description']}
            - Records: {report_data['row_count']:,}
            - Variables: {report_data['column_count']}
            
            Key Statistics: {numerical_stats}
            
            Text Analysis Columns: {text_analysis_cols}
            
            Create a concise executive summary (2-3 paragraphs) highlighting:
            1. Key findings and insights
            2. Important trends or patterns
            3. Business recommendations
            
            Format as a professional business report.
            """
        
        elif report_type == "summary":
            prompt = f"""
            Create a summary report for this data analysis.
            
            Data Details:
            - Table: {table_name} 
            - Records: {report_data['row_count']:,}
            - Columns: {', '.join(report_data['columns'])}
            - Description: {report_data['description']}
            
            Numerical Analysis: {numerical_stats}
            Text Analysis Results: {text_analysis_cols}
            
            Create a structured summary including:
            1. Data overview
            2. Key metrics and statistics
            3. Notable patterns or insights
            4. Data quality observations
            
            Keep it factual and data-focused.
            """
        
        else:  # comprehensive
            prompt = f"""
            Create a comprehensive analysis report for this dataset.
            
            Dataset Information:
            - Name: {table_name}
            - Description: {report_data['description']}
            - Size: {report_data['row_count']:,} rows × {report_data['column_count']} columns
            - Columns: {', '.join(report_data['columns'])}
            
            Statistical Summary: {numerical_stats}
            
            Text Analysis Columns: {text_analysis_cols}
            
            Sample Data: {report_data['sample_data']}
            
            Create a detailed report with:
            1. Executive Summary
            2. Data Overview and Quality Assessment
            3. Statistical Analysis Results
            4. Key Findings and Insights
            5. Patterns and Trends Identified
            6. Recommendations for Action
            7. Data Limitations and Considerations
            
            Make it professional and actionable.
            """
        
        # Generate report using LLM
        response = llm.invoke(prompt)
        generated_report = response.content
        
        # Save report to database
        report_table_name = f"report_{table_name}"
        report_df = pd.DataFrame([{
            "report_type": report_type,
            "source_table": table_name,
            "generated_at": pd.Timestamp.now(),
            "content": generated_report
        }])
        
        db_manager.save_dataframe(
            report_df,
            report_table_name,
            f"{report_type.title()} analysis report for {table_name}"
        )
        
        return f"""📊 **{report_type.title()} Analysis Report Generated**

Source Data: {table_name}
Report Table: {report_table_name}
Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

---

{generated_report}

---

This report has been saved to table '{report_table_name}' for future reference."""
        
    except Exception as e:
        return f"Error generating report: {str(e)}"


@tool
def create_data_summary(table_name: str) -> str:
    """Create a quick data summary with key metrics and insights.
    
    Args:
        table_name: Name of the table to summarize
        
    Returns:
        Quick summary of the dataset with key metrics
    """
    try:
        table_info = db_manager.get_table_info(table_name)
        df = db_manager.execute_query(f"SELECT * FROM {table_name}")
        
        if len(df) == 0:
            return f"Table '{table_name}' is empty."
        
        summary = f"""📋 **Data Summary for '{table_name}'**

**Basic Info:**
• Records: {len(df):,}
• Columns: {len(df.columns)}
• Description: {table_info.get('description', 'N/A')}

**Column Overview:**"""
        
        for col in df.columns:
            dtype = str(df[col].dtype)
            null_count = df[col].isnull().sum()
            unique_count = df[col].nunique()
            
            summary += f"\n• {col} ({dtype}): {unique_count:,} unique values, {null_count:,} missing"
        
        # Add statistics for numerical columns
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        if len(numerical_cols) > 0:
            summary += f"\n\n**Numerical Columns Summary:**"
            for col in numerical_cols:
                try:
                    stats = df[col].describe()
                    summary += f"\n• {col}: Mean={stats['mean']:.2f}, Median={stats['50%']:.2f}, Range=[{stats['min']:.2f}, {stats['max']:.2f}]"
                except:
                    pass
        
        # Check for text analysis columns
        text_cols = [col for col in df.columns if any(keyword in col.lower() for keyword in ['sentiment', 'theme', 'category', 'tag'])]
        if text_cols:
            summary += f"\n\n**Text Analysis Results:**"
            for col in text_cols:
                try:
                    value_counts = df[col].value_counts().head(3)
                    summary += f"\n• {col}: {', '.join([f'{val}({count})' for val, count in value_counts.items()])}"
                except:
                    pass
        
        return summary
        
    except Exception as e:
        return f"Error creating data summary: {str(e)}"


@tool
def compare_tables(table1_name: str, table2_name: str) -> str:
    """Compare two tables and highlight differences and similarities.
    
    Args:
        table1_name: Name of the first table
        table2_name: Name of the second table
        
    Returns:
        Comparison report between the two tables
    """
    try:
        # Get data for both tables
        df1 = db_manager.execute_query(f"SELECT * FROM {table1_name}")
        df2 = db_manager.execute_query(f"SELECT * FROM {table2_name}")
        
        info1 = db_manager.get_table_info(table1_name)
        info2 = db_manager.get_table_info(table2_name)
        
        comparison = f"""📊 **Table Comparison: {table1_name} vs {table2_name}**

**Size Comparison:**
• {table1_name}: {len(df1):,} rows × {len(df1.columns)} columns
• {table2_name}: {len(df2):,} rows × {len(df2.columns)} columns

**Column Comparison:**"""
        
        cols1 = set(df1.columns)
        cols2 = set(df2.columns)
        
        common_cols = cols1.intersection(cols2)
        only_in_1 = cols1 - cols2
        only_in_2 = cols2 - cols1
        
        if common_cols:
            comparison += f"\n• Common columns ({len(common_cols)}): {', '.join(sorted(common_cols))}"
        
        if only_in_1:
            comparison += f"\n• Only in {table1_name} ({len(only_in_1)}): {', '.join(sorted(only_in_1))}"
        
        if only_in_2:
            comparison += f"\n• Only in {table2_name} ({len(only_in_2)}): {', '.join(sorted(only_in_2))}"
        
        # Compare common numerical columns
        if common_cols:
            comparison += f"\n\n**Statistical Comparison (Common Columns):**"
            for col in common_cols:
                if df1[col].dtype in ['int64', 'float64'] and df2[col].dtype in ['int64', 'float64']:
                    try:
                        mean1 = df1[col].mean()
                        mean2 = df2[col].mean()
                        comparison += f"\n• {col}: {table1_name} avg={mean1:.2f}, {table2_name} avg={mean2:.2f}"
                    except:
                        pass
        
        return comparison
        
    except Exception as e:
        return f"Error comparing tables: {str(e)}" 