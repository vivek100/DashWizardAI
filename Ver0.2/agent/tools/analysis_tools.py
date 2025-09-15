"""Data Analysis Tools

Tools for performing numerical analysis, text analysis, and data transformations.
"""

from datetime import datetime
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Literal
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from .storage_tools import db_manager
from ..config import config
import tiktoken
from pydantic import BaseModel, Field


@tool
def execute_pandas_query(
    table_name: str, 
    operation_description: str,
    return_mode: Literal["preview", "full", "none"] = "preview",
    create_table: bool = True,
    result_table_name: str = None,
    preview_rows: int = 5,
    configFromFrontend: RunnableConfig = None
) -> str:
    """Execute pandas operations on a table with flexible output options.
    
    Performs data analysis operations like filtering, grouping, aggregation,
    and transformation. You can control whether to save results as a new table,
    return data preview, or return full data.
    
    Args:
        table_name: Name of the source table
        operation_description: Description of the operation to perform
                              (e.g., "filter rows where age > 25", 
                               "group by department and count",
                               "calculate average rating by category")
        return_mode: What data to return in response:
                    - "preview": Return first N rows (default)
                    - "full": Return all result data (capped at 1000 rows)
                    - "none": Return only metadata, no data rows
        create_table: Whether to save results as a new table (default: True)
        result_table_name: Name of the result table (default: None)
        preview_rows: Number of rows to show in preview mode (default: 5)
    
    Returns:
        Formatted string with operation results, schema, data, and metadata
    """
    try:
        context = configFromFrontend.get("configurable", {}) if config else {}
        user_id = context["user_id"]
        # Get the data
        df = db_manager.execute_query(f"SELECT * FROM {table_name}")
        
        if len(df) == 0:
            return f"Error: Table '{table_name}' is empty."
        pandas_code = ""
        
        # Use LLM to generate pandas code
        llm = ChatOpenAI(model=config.AGENT_SMALL_MODEL, temperature=0)
        
        prompt = f"""
        You are an expert in pandas DataFrame operations. Given a pandas DataFrame with the following columns and data types:
        {df.dtypes.to_dict()}

        Sample data (first 3 rows):
        {df.head(3).to_string()}

        Generate Python pandas code to perform the following operation: {operation_description}

        Requirements:
        - The DataFrame variable is called 'df'.
        - Assign the result to a variable called 'result_df'.
        - Return only the pandas code, no explanations or comments.
        - Use only safe operations (no file I/O, no external libraries beyond pandas and numpy).
        - Ensure the code handles edge cases (e.g., empty DataFrames, missing columns, or invalid data types).
        - Avoid operations that could lead to errors (e.g., division by zero, accessing non-existent columns).
        - If grouping or aggregating, include `.reset_index()` to ensure a flat DataFrame output.
        - If filtering, ensure conditions are valid for the column data types.
        - If the operation is ambiguous, choose a sensible default (e.g., for "count", use .count() or .value_counts() as appropriate).

        Example format:
        result_df = df[df['age'] > 25]
        result_df = df.groupby('department').agg({{'salary': 'mean'}}).reset_index()

        Examples of operation descriptions and their corresponding pandas code:
        1. Input: "filter rows where age > 30"
        Output: result_df = df[df['age'] > 30]
        2. Input: "group by department and calculate average salary"
        Output: result_df = df.groupby('department').agg({{'salary': 'mean'}}).reset_index()
        3. Input: "count number of rows per category"
        Output: result_df = df.groupby('category').size().reset_index(name='count')
        4. Input: "select rows where name is not null"
        Output: result_df = df[df['name'].notna()]
        5. Input: "calculate total sales by region and sort by total descending"
        Output: result_df = df.groupby('region').agg({{'sales': 'sum'}}).reset_index().sort_values('sales', ascending=False)
        6. Input: "filter rows where age > 25 and salary > 50000, then group by department to get average salary and total bonus"
        Output: result_df = df[(df['age'] > 25) & (df['salary'] > 50000)].groupby('department').agg({{'salary': 'mean', 'bonus': 'sum'}}).reset_index()
        7. Input: "create a new column 'tax' as 10% of salary, then filter rows where tax > 5000 and sort by tax descending"
        Output: result_df = df.copy(); result_df['tax'] = df['salary'] * 0.1; result_df = result_df[result_df['tax'] > 5000].sort_values('tax', ascending=False)
        8. Input: "group by region, calculate average and max sales, join with original data to include employee names, and filter for average sales > 10000"
        Output: result_df = df.groupby('region').agg({{'sales': ['mean', 'max']}}).reset_index(); result_df.columns = ['region', 'avg_sales', 'max_sales']; result_df = result_df[result_df['avg_sales'] > 10000].merge(df[['region', 'employee_name']], on='region', how='left')

        Generated Code:
        """
        response = llm.invoke(prompt)
        pandas_code = response.content.strip()
        
        # Clean the code (remove markdown formatting if present)
        if pandas_code.startswith("```python"):
            pandas_code = pandas_code.replace("```python", "").replace("```", "").strip()
        
        # Execute the pandas operation safely
        try:
            # Create safe environment for code execution
            safe_globals = {
                'df': df,
                'pd': pd,
                'np': np,
                'result_df': None
            }
            
            exec(pandas_code, safe_globals)
            result_df = safe_globals['result_df']
            
            if result_df is None:
                return f"Error: The operation did not produce a result. Generated code: {pandas_code}"
            
            # Handle table creation
            if create_table:
                if result_table_name is None:
                    result_table_name = f"analysis_{table_name}_{len(db_manager.get_table_names())}"
                db_manager.save_dataframe(
                    result_df, 
                    result_table_name,
                    f"Analysis result: {operation_description}",
                    user_id
                )
            
            # Prepare schema string
            schema_str = ', '.join([f"{col}({dtype})" for col, dtype in zip(result_df.columns, result_df.dtypes)])
            
            # Prepare data string
            if return_mode == "preview":
                data_str = f"**Preview ({min(preview_rows, len(result_df))} of {len(result_df)} rows):**\n"
                data_str += result_df.head(preview_rows).to_string(index=False)
            elif return_mode == "full":
                max_rows = min(1000, len(result_df))
                data_str = f"**Full Data ({max_rows} of {len(result_df)} rows):**\n"
                data_str += result_df.head(max_rows).to_string(index=False)
                if len(result_df) > 1000:
                    data_str += f"\n(Data truncated to first 1000 rows)"
            else:
                data_str = ""
            
            # Generate contextual message based on options
            if create_table and return_mode == "preview":
                message = f"""✅ Analysis completed successfully!

**Operation:** {operation_description}
**Source:** {table_name} → **Result:** {result_table_name}

**New Table Created:** '{result_table_name}' with {len(result_df):,} rows and {len(result_df.columns)} columns
**Schema:** {schema_str}

**Preview ({min(preview_rows, len(result_df))} of {len(result_df)} rows):**
{data_str}

**Generated Code:**
```python
{pandas_code}
```

💡 **Next Steps:** Use table '{result_table_name}' for further analysis or call this tool again with return_mode='full' to see all data."""

            elif create_table and return_mode == "full":
                data_info = f"all {len(result_df)} rows" if len(result_df) <= 1000 else f"first 1000 of {len(result_df)} rows"
                message = f"""✅ Analysis completed with full data return!

**Operation:** {operation_description}
**Source:** {table_name} → **Result:** {result_table_name}

**New Table Created:** '{result_table_name}' with {len(result_df):,} rows and {len(result_df.columns)} columns
**Schema:** {schema_str}

**Full Data Returned:**
{data_str}

**Generated Code:**
```python
{pandas_code}
```

💡 **Next Steps:** Use table '{result_table_name}' for further analysis or process the returned data."""

            elif create_table and return_mode == "none":
                message = f"""✅ Analysis completed - table created!

**Operation:** {operation_description}
**Source:** {table_name} → **Result:** {result_table_name}

**New Table Created:** '{result_table_name}' with {len(result_df):,} rows and {len(result_df.columns)} columns
**Schema:** {schema_str}

**Generated Code:**
```python
{pandas_code}
```

💡 **Next Steps:** Use table '{result_table_name}' for further analysis or call this tool with return_mode='preview'/'full' to see the data."""

            elif not create_table and return_mode == "preview":
                message = f"""✅ Analysis completed - preview returned!

**Operation:** {operation_description}
**Source:** {table_name} (no new table created)

**Result:** {len(result_df):,} rows and {len(result_df.columns)} columns
**Schema:** {schema_str}

**Preview ({min(preview_rows, len(result_df))} of {len(result_df)} rows):**
{data_str}

**Generated Code:**
```python
{pandas_code}
```

💡 **Next Steps:** Call with create_table=True to save results, or return_mode='full' to see all data."""

            elif not create_table and return_mode == "full":
                data_info = f"all {len(result_df)} rows" if len(result_df) <= 1000 else f"first 1000 of {len(result_df)} rows"
                message = f"""✅ Analysis completed - full data returned!

**Operation:** {operation_description}
**Source:** {table_name} (no new table created)

**Result:** {len(result_df):,} rows and {len(result_df.columns)} columns
**Schema:** {schema_str}

**Full Data Returned:**
{data_str}

**Generated Code:**
```python
{pandas_code}
```

💡 **Next Steps:** Call with create_table=True to save results for further analysis."""

            else:  # not create_table and return_mode == "none"
                message = f"""✅ Analysis completed - metadata only!

**Operation:** {operation_description}
**Source:** {table_name} (no new table created)

**Result:** {len(result_df):,} rows and {len(result_df.columns)} columns
**Schema:** {schema_str}

**Generated Code:**
```python
{pandas_code}
```

💡 **Next Steps:** Call with return_mode='preview'/'full' to see data, or create_table=True to save results."""

            return message

        except Exception as code_error:
            return f"Error executing pandas operation: {str(code_error)}\nGenerated code: {pandas_code}"
        
    except Exception as e:
        return f"Error in execute_pandas_query: {str(e)}\nGenerated code: {pandas_code if 'pandas_code' in locals() else 'Not generated'}"


# Pydantic models to ensure the LLM provides a structured and reliable response.
# This structure is robust, as each result is explicitly tied to a row_id.
class AnalysisValue(BaseModel):
    """The result for a single analysis task on a single row."""
    column_name: str = Field(description="The column name for this analysis, matching the input task.")
    value: str = Field(description="The computed value for the analysis (e.g., 'positive', 'summary text').")

class RowResult(BaseModel):
    """The full set of analysis results for a single row of data."""
    row_id: int = Field(description="The unique temporary integer ID for the original row.")
    results: List[AnalysisValue] = Field(description="A list containing the results for each analysis task.")

class BatchResponse(BaseModel):
    """The structured response for an entire batch of text analyses."""
    batch_results: List[RowResult]

@tool
def analyze_text_data(
    table_name: str,
    text_column: str,
    analysis_tasks: List[Dict[str, str]],
    create_table: bool = True,
    result_table_name: Optional[str] = None,
    return_mode: Literal["preview", "full"] = "preview",
    preview_rows: int = 5,
    configFromFrontend: RunnableConfig = None
) -> str:
    """
    Performs advanced, multi-faceted AI text analysis on a column and creates new columns for the results.

    This tool takes a list of analysis tasks, where each task defines a new column and the logic to
    populate it. It processes text in batches, automatically handling token limits.
    
    Args:
        table_name: The name of the source table.
        text_column: The name of the column containing text to analyze.
        analysis_tasks: A list of dictionaries, each defining an analysis. 
                        Example: [{"column_name": "sentiment", "description": "Classify sentiment as positive or negative."}]
        create_table: If True (default), saves the enhanced data to a new table.
        result_table_name: Optional name for the new table. If None, a name is generated.
        return_mode: Controls the data returned in the response: 'preview' (default) or 'full'.
        preview_rows: Number of rows to show in preview mode.
    
    Returns:
        A formatted string describing the outcome and data based on the arguments.
    """
    try:
        context = configFromFrontend.get("configurable", {}) if config else {}
        user_id = context["user_id"]
        df = db_manager.execute_query(f"SELECT * FROM {table_name}")
        if text_column not in df.columns:
            return f"Error: Column '{text_column}' not found in table '{table_name}'."
        if not (1 <= len(analysis_tasks) <= 2):
            return "Error: Please provide either 1 or 2 analysis tasks (minimum 1, maximum 2)."
        for task in analysis_tasks:
            if "column_name" not in task or "description" not in task:
                return "Error: Each analysis task must be a dictionary with 'column_name' and 'description' keys."

        # Use a temporary ID for robust joining, regardless of original table structure
        df['_temp_id_'] = df.index
        df_to_analyze = df[['_temp_id_', text_column]].dropna().reset_index(drop=True)
        if len(df_to_analyze) == 0:
            return f"Error: No non-empty text data to analyze in column '{text_column}'."

        llm = ChatOpenAI(model=config.AGENT_SMALL_MODEL, temperature=0.0).with_structured_output(BatchResponse)
        tokenizer = tiktoken.get_encoding("cl100k_base")
        
        all_results_data = []
        initial_batch_size = 40

        # Process the dataframe in chunks
        for i in range(0, len(df_to_analyze), initial_batch_size):
            batch_df = df_to_analyze.iloc[i:i + initial_batch_size]
            
            # Dynamically reduce batch size if it exceeds the token limit
            while True:
                if len(batch_df) == 0:
                    return f"Error: A single row of data starting at original index {i} is too large to process. Please inspect the data."
                
                # Format the tasks and data for the prompt
                tasks_str = "\n".join([f'- Column Name: {task["column_name"]}, Analysis: {task["description"]}' for task in analysis_tasks])
                batch_data_str = "\n".join([f'{row["_temp_id_"]}: "{row[text_column]}"' for _, row in batch_df.iterrows()])
                
                prompt = f"""
                You are a text analysis expert. For each row in the batch below, perform the following analyses:
                --- ANALYSIS TASKS ---
                You need to add following column with the correspoing analysis 
                {tasks_str}
                ---

                Your response must be a JSON object that strictly follows the required schema. For each row, provide its
                original ID and a list of results, where each result corresponds to one of the analysis tasks.

                --- EXAMPLE ---
                INPUT:
                - Tasks: [{{"column_name": "sentiment", "description": "Is it positive or negative?"}}, {{"column_name": "summary", "description": "Summarize in 5 words."}}]
                - Data: 101: "The service was amazing!"
                OUTPUT:
                - Expected JSON for this row:
                {{
                    "row_id": 101,
                    "results": [
                        {{ "column_name": "sentiment", "value": "positive" }},
                        {{ "column_name": "summary", "value": "Amazing service, highly recommended." }}
                    ]
                }}
                ---

                Now, analyze the following data batch:
                --- DATA TO ANALYZE ---
                {batch_data_str}
                ---
                """
                
                token_count = len(tokenizer.encode(prompt))
                if token_count < 8000:  # Safety margin for prompt + response
                    break
                
                # If too large, halve the batch size and retry
                batch_df = batch_df.iloc[:len(batch_df) // 2]

            try:
                response = llm.invoke(prompt)
                for row_res in response.batch_results:
                    row_data = {'_temp_id_': row_res.row_id}
                    for analysis in row_res.results:
                        row_data[analysis.column_name] = analysis.value
                    all_results_data.append(row_data)
            except Exception as e:
                return f"Error during AI analysis for batch starting at index {i}: {str(e)}"

        if not all_results_data:
            return "Error: Text analysis did not produce any results."

        results_df = pd.DataFrame(all_results_data)
        result_df = pd.merge(df, results_df, on='_temp_id_', how='left').drop(columns=['_temp_id_'])
        
        # --- Handle Output ---
        final_message = "✅ Text analysis completed successfully!\n"
        
        if create_table:
            timeStamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            if result_table_name is None:
                result_table_name = f"text_analysis_{table_name}"
            db_manager.save_dataframe(result_df, result_table_name, f"Analyzed '{text_column}' with the following analysis tasks: {analysis_tasks}. On Date and Time: {timeStamp}, if you have same name table use the lastest based on this time stamp", user_id)
            final_message += f"**New Table Created:** '{result_table_name}' with {len(result_df)} rows. It has following time stamp: {timeStamp}, use time stamp to identify the table\n"
        else:
            final_message += f"**Source Table:** '{table_name}' (Results not saved to a new table).\n"
        
        schema_str = ', '.join([f"{col}({dtype})" for col, dtype in zip(result_df.columns, result_df.dtypes)])
        final_message += f"**Result Schema:** {schema_str}\n"

        if return_mode == "preview":
            data_str = result_df.head(preview_rows).to_string(index=False)
            final_message += f"\n**Preview ({min(preview_rows, len(result_df))} of {len(result_df)} rows):**\n{data_str}"
        elif return_mode == "full":
            max_rows = min(200, len(result_df))
            data_str = result_df.head(max_rows).to_string(index=False)
            final_message += f"\n**Full Data ({min(max_rows, len(result_df))} of {len(result_df)} rows):**\n{data_str}"
            if len(result_df) > 200: final_message += "\n(Data truncated to first 200 rows)"
        
        if create_table:
            final_message += f"\n\n💡 Use table '{result_table_name}' for further analysis."
        else:
            final_message += "\n\n💡 To save these results, call again with `create_table=True`."
            
        return final_message

    except Exception as e:
        return f"An unexpected error occurred in analyze_text_data: {str(e)}" 