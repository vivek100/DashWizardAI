**Technical Requirements Document for a Self-Calling AI Agent Using LangGraph's ReAct Framework**

This document details the technical requirements for implementing a self-calling AI agent that autonomously performs multi-step numerical and textual analysis on CSV files, as specified in the functional requirements document (dated July 09, 2025, 02:03 PM IST). The agent leverages **LangGraph’s ReAct (Reasoning and Acting) Agent** for orchestrating tool calls, **pandas** for data manipulation, and **DuckDB** for persistent storage. The code structure emphasizes modularity, best coding practices, and extensibility to facilitate future feature additions, prompt management, and maintainability.  
**Document Prepared By**: Grok 3 (xAI)  
**Date**: July 09, 2025, 03:15 PM IST  
**Contact**: For pricing or API details, visit [https://x.ai/grok](https://x.ai/grok) or [https://x.ai/api](https://x.ai/api).  
---

**1\. Technical Requirements**

**1.1 Code Structure**

* **Modularity**:  
  * Organize the codebase into distinct modules for separation of concerns: agent logic, tools, data storage, and prompt management.  
  * Use Python packages and modules to encapsulate functionality (e.g., agent/, tools/, storage/, prompts/).  
  * Ensure each module has a single responsibility (e.g., tools handle specific tasks, agent orchestrates workflow).  
* **File Structure**:  
  * agent/: Contains LangGraph ReAct agent logic, including workflow graph and state management.  
    * react\_agent.py: Defines the ReAct agent, graph structure, and LLM integration.  
  * tools/: Implements data manipulation and text analysis tools.  
    * data\_tools.py: Numerical tools (e.g., load CSV, execute query).  
    * text\_tools.py: Text analysis tools (e.g., sentiment, theme extraction, report generation).  
  * storage/: Manages DuckDB interactions.  
    * duckdb\_storage.py: Handles table creation, retrieval, and storage.  
  * prompts/: Manages LLM prompts for reasoning and analysis.  
    * prompt\_manager.py: Centralizes prompt templates and generation logic.  
  * config/: Stores configuration settings.  
    * config.py: Defines constants, environment variables, and settings.  
  * main.py: Entry point for running the agent, tying modules together.  
* **Class-Based Design**:  
  * Use a central DataAgent class to encapsulate tool execution, DuckDB connections, and state management.  
  * Each tool (e.g., load\_csv\_to\_table, analyze\_text) implemented as a method of DataAgent or standalone functions in tools/.  
  * Ensure classes are lightweight, with clear interfaces (e.g., input/output types defined).

**1.2 Best Coding Practices**

* **Code Style**:  
  * Adhere to **PEP 8** for Python code style (e.g., 4-space indentation, 79-character line length).  
  * Use descriptive variable/function names (e.g., load\_csv\_to\_table instead of load).  
  * Include docstrings for all classes, methods, and functions, following **Google Python Style Guide** for clarity.  
* **Type Hints**:  
  * Use Python type hints (e.g., from typing import List, Dict, Callable) for all function signatures and return types.  
  * Example: def load\_csv\_to\_table(csv\_file: str) \-\> str.  
  * Enforce type checking using mypy during development.  
* **Error Handling**:  
  * Implement comprehensive error handling with try-except blocks for all external operations (e.g., file I/O, DuckDB queries, LLM calls).  
  * Raise custom exceptions (e.g., DataAgentError) for specific failure cases (e.g., invalid CSV, table not found).  
  * Log errors using the logging module with levels (e.g., INFO, ERROR) for debugging and monitoring.  
* **Logging**:  
  * Use Python’s logging module to log key actions (e.g., tool calls, errors, LLM responses).  
  * Configure log levels (e.g., DEBUG for development, INFO for production).  
  * Save logs to a file (e.g., agent.log) for traceability.  
* **Testing**:  
  * Write unit tests for each tool using pytest, covering success and failure cases (e.g., valid/invalid CSVs, query errors).  
  * Include integration tests for end-to-end workflows (e.g., load CSV, analyze text, generate report).  
  * Mock LLM responses using unittest.mock to test without API calls.  
* **Documentation**:  
  * Include a README.md with setup instructions, usage examples, and dependency installation.  
  * Maintain inline comments for complex logic (e.g., text batching, LLM prompt generation).  
  * Generate API documentation using Sphinx or similar tools.

**1.3 Modularity and Extensibility**

* **Modular Tools**:  
  * Implement each tool as an independent function or method with well-defined inputs/outputs.  
  * Example: analyze\_text(table\_name: str, text\_column: str, predefined\_themes: List\[str\]) \-\> str returns a table name, enabling reuse across workflows.  
  * Use dependency injection (e.g., pass DataAgent instance to tools) to reduce coupling.  
* **Extensible Design**:  
  * Allow new tools to be added by registering them in the ReAct agent’s toolset (e.g., via a dictionary in react\_agent.py).  
  * Support new analysis types (e.g., visualization, statistical modeling) by adding tools to tools/ without modifying core logic.  
  * Use configuration files (config.py) for settings (e.g., DuckDB path, LLM parameters) to avoid hardcoding.  
* **Prompt Management**:  
  * Centralize prompt templates in prompts/prompt\_manager.py as a PromptManager class or dictionary.  
  * Example: Store templates for reasoning, pandas queries, text analysis, and report generation.  
  * Allow dynamic prompt customization via parameters (e.g., custom\_prompt in generate\_text\_report).  
  * Support versioning of prompts to test new templates without breaking existing workflows.  
* **Future Features**:  
  * Design tools to be agnostic of data type (e.g., analyze\_text works for any text column, not just comments).  
  * Use abstract base classes or interfaces (e.g., abc.ABC) for tool definitions to standardize new tool implementations.  
  * Support plugin-like extensions (e.g., new NLP libraries) by defining a common tool interface.

**1.4 Performance and Scalability**

* **Performance**:  
  * Optimize pandas operations using vectorized methods (e.g., df.groupby() instead of loops).  
  * Leverage DuckDB’s columnar storage and query optimization for large datasets.  
  * Batch text analysis requests in analyze\_text and generate\_text\_report to manage LLM token limits (estimate \~1.5 words per token).  
* **Scalability**:  
  * Support large CSVs (\>1GB) using DuckDB’s out-of-core processing (read\_csv\_auto).  
  * Implement chunked DataFrame processing in pandas for memory-intensive tasks.  
  * Use DuckDB’s in-memory mode (:memory:) for temporary analysis to reduce disk I/O.  
* **Resource Management**:  
  * Close DuckDB connections properly using context managers or DataAgent.close().  
  * Limit LLM API calls by caching frequent queries or schemas in DuckDB.  
  * Monitor Grok 3 quotas (free tier or SuperGrok) to avoid rate limits.

**1.5 Security**

* **Data Security**:  
  * Enforce read-only access to original DuckDB tables by restricting tools to SELECT, CREATE TABLE, and CREATE VIEW.  
  * Validate text analysis outputs (e.g., ensure valid sentiment values, non-empty themes).  
  * Secure DuckDB database files with file system permissions.  
* **Input Validation**:  
  * Validate tool inputs (e.g., table names, column names) to prevent errors or injection attacks.  
  * Sanitize LLM-generated queries (pandas or SQL) to block unauthorized operations.  
* **Configuration**:  
  * Store sensitive settings (e.g., DuckDB path, LLM API keys) in environment variables using python-dotenv.  
  * Avoid hardcoding sensitive data in source code.

---

**2\. Code Structure and Implementation Details**

**2.1 Module Structure**

* **agent/react\_agent.py**:  
  * Defines the ReActAgent class, encapsulating the LangGraph workflow.  
  * Implements the graph with nodes for reasoning, tool calls, and result aggregation.  
  * Manages state (e.g., table names, intermediate results) using a dictionary.  
  * Integrates with the LLM (e.g., Grok 3\) for reasoning and query generation.  
* **tools/data\_tools.py**:  
  * Contains numerical analysis tools: load\_csv\_to\_table, get\_table\_names, get\_table\_schema, execute\_query, execute\_sql\_query, save\_analysis, get\_analysis\_object.  
  * Each tool is a standalone function or method of DataAgent.  
* **tools/text\_tools.py**:  
  * Contains text analysis tools: analyze\_text, generate\_text\_report.  
  * Integrates with Grok 3 for sentiment, theme extraction, and report generation.  
* **storage/duckdb\_storage.py**:  
  * Defines the DuckDBStorage class for managing DuckDB connections and queries.  
  * Handles table creation, retrieval, and schema management.  
* **prompts/prompt\_manager.py**:  
  * Defines the PromptManager class or dictionary for managing LLM prompt templates.  
  * Supports templates for reasoning, pandas queries, SQL queries, text analysis, and reports.  
* **config/config.py**:  
  * Stores constants (e.g., DuckDB path, batch size) and loads environment variables.  
* **main.py**:  
  * Entry point for running the agent, initializing modules, and processing user prompts.

**2.2 Key Classes and Functions**

* **DataAgent (tools/data\_tools.py, tools/text\_tools.py)**:  
  * **Purpose**: Central class for tool execution and DuckDB interactions.  
  * **Attributes**:  
    * duckdb\_conn: DuckDB connection object.  
    * original\_tables: Set of read-only table names.  
    * prompt\_manager: Instance of PromptManager for LLM prompts.  
  * **Methods**:  
    * load\_csv\_to\_table(csv\_file: str) \-\> str: Loads CSV into DuckDB.  
    * get\_table\_names() \-\> List\[str\]: Lists DuckDB tables/views.  
    * get\_table\_schema(table\_name: str) \-\> List\[Dict\[str, str\]\]: Returns schema.  
    * execute\_query(query\_func: Callable\[\[pd.DataFrame\], pd.DataFrame\], table\_name: str) \-\> pd.DataFrame: Runs pandas query.  
    * execute\_sql\_query(query: str, table\_name: str) \-\> pd.DataFrame: Runs SQL query (optional).  
    * save\_analysis(analysis\_data: pd.DataFrame, result\_name: str, as\_view: bool) \-\> str: Saves results to DuckDB.  
    * get\_analysis\_object(name: str) \-\> pd.DataFrame: Retrieves DataFrame.  
    * analyze\_text(table\_name: str, text\_column: str, predefined\_themes: List\[str\]) \-\> str: Analyzes text, adds sentiment/theme columns.  
    * generate\_text\_report(table\_name: str, text\_column: str, custom\_prompt: str) \-\> str: Generates report with citations.  
    * close(): Closes DuckDB connection.  
  * **Implementation Notes**:  
    * Use dependency injection to pass duckdb\_conn or prompt\_manager.  
    * Ensure read-only access by copying DataFrames in execute\_query and restricting SQL operations.  
* **ReActAgent (agent/react\_agent.py)**:  
  * **Purpose**: Orchestrates the LangGraph workflow.  
  * **Attributes**:  
    * graph: LangGraph workflow object.  
    * llm: LLM client (e.g., Grok 3).  
    * data\_agent: Instance of DataAgent for tool access.  
    * state: Dictionary tracking table names, intermediate results, etc.  
  * **Methods**:  
    * run(prompt: str) \-\> Dict: Processes user prompt, executes workflow, returns result.  
    * reason(state: Dict) \-\> Dict: LLM-driven reasoning to select tools.  
    * execute\_tool(tool\_name: str, inputs: Dict) \-\> Dict: Calls a tool with inputs.  
    * aggregate\_results(state: Dict) \-\> Dict: Combines outputs for final result.  
* **DuckDBStorage (storage/duckdb\_storage.py)**:  
  * **Purpose**: Manages DuckDB interactions.  
  * **Attributes**:  
    * conn: DuckDB connection.  
    * db\_path: Database file path.  
  * **Methods**:  
    * create\_table(df: pd.DataFrame, table\_name: str) \-\> None: Creates a table.  
    * create\_view(query: str, view\_name: str) \-\> None: Creates a view.  
    * get\_dataframe(table\_name: str) \-\> pd.DataFrame: Retrieves DataFrame.  
    * get\_schema(table\_name: str) \-\> List\[Dict\]: Returns schema.  
    * close(): Closes connection.  
* **PromptManager (prompts/prompt\_manager.py)**:  
  * **Purpose**: Manages LLM prompt templates.  
  * **Attributes**:  
    * templates: Dictionary of prompt templates (e.g., reasoning, text\_analysis, report).  
  * **Methods**:  
    * get\_prompt(template\_name: str, params: Dict) \-\> str: Returns formatted prompt.  
    * add\_template(name: str, template: str) \-\> None: Adds new template.  
    * update\_template(name: str, template: str) \-\> None: Updates existing template.

**2.3 Tool Implementation Details**

* **load\_csv\_to\_table**:  
  * Use duckdb.read\_csv\_auto for efficient loading.  
  * Generate unique table names using timestamp and hash (e.g., csv\_table\_12345678).  
  * Store schema metadata in DataAgent.metadata.  
* **get\_table\_names**:  
  * Query duckdb\_tables for table/view names.  
  * Return as a sorted list for consistency.  
* **get\_table\_schema**:  
  * Use DuckDB’s DESCRIBE or pandas .dtypes.  
  * Return list of {column\_name: str, data\_type: str}.  
* **execute\_query**:  
  * Input: Callable accepting a DataFrame, returning a DataFrame.  
  * Load table as DataFrame, copy to ensure read-only.  
  * Validate output type (pd.DataFrame).  
  * Log query execution details.  
* **execute\_sql\_query** (optional):  
  * Restrict to SELECT, CREATE TABLE, CREATE VIEW.  
  * Use DuckDB’s SQL engine, convert results to DataFrame.  
* **save\_analysis**:  
  * Merge text analysis results using employee\_id or pandas index.  
  * Save to DuckDB as table or view, supporting JSON reports.  
  * Log storage operation.  
* **get\_analysis\_object**:  
  * Query DuckDB table/view, return DataFrame.  
  * Validate table existence.  
* **analyze\_text**:  
  * Load DataFrame, extract text column.  
  * Batch text entries (estimate \~1.5 words per token) for LLM calls.  
  * Prompt Grok 3 for sentiment (positive, negative, neutral) and themes, allowing dynamic theme creation.  
  * Optional: Use BERTopic for unsupervised theme discovery.  
  * Merge results with original DataFrame, save to DuckDB.  
  * Return new table name.  
* **generate\_text\_report**:  
  * Load DataFrame, optionally preprocess with execute\_query.  
  * Batch text entries for LLM calls.  
  * Prompt Grok 3 for JSON report with themes, summaries, and citations.  
  * Save report as JSON string or structured table in DuckDB.  
  * Return table name.

**2.4 Prompt Management**

* **PromptManager**:  
  * Store templates as strings with placeholders (e.g., {table\_name}, {columns}).  
  * Example templates:  
    * Reasoning: “Given prompt: {prompt}, select tools from {tool\_list}.”  
    * Text Analysis: “Analyze text entries for sentiment and themes from {themes}. Return JSON.”  
    * Report: “Summarize themes, provide insights, cite by {id\_column}. Return JSON.”  
  * Support dynamic parameters (e.g., schema, custom prompt text).  
* **Versioning**:  
  * Store templates with version numbers (e.g., text\_analysis\_v1).  
  * Allow switching templates via configuration.  
* **Testing**:  
  * Test prompts with sample data to ensure structured outputs (e.g., JSON).  
  * Log prompt inputs/outputs for debugging.

---

**3\. Best Practices Implementation**

* **Code Organization**:  
  * Use one class/function per file for small components (e.g., PromptManager in prompt\_manager.py).  
  * Group related tools in modules (e.g., data\_tools.py, text\_tools.py).  
* **Version Control**:  
  * Use Git for source control, with branches for features (e.g., feature/text-analysis).  
  * Tag releases (e.g., v1.0.0) for stable versions.  
* **Dependency Management**:  
  * Use requirements.txt or pyproject.toml for dependencies.  
  * Pin versions (e.g., pandas==2.2.2) to ensure reproducibility.  
* **Code Review**:  
  * Enforce linting with flake8 or pylint for style and quality.  
  * Require unit tests for all new tools/features.  
* **Continuous Integration**:  
  * Set up CI/CD with GitHub Actions or similar to run tests, linters, and type checkers.  
  * Automate documentation generation with Sphinx.  
* **Extensibility**:  
  * Define a ToolInterface (using abc.ABC) for new tools:  
  * python

from abc import ABC, abstractmethod  
class ToolInterface(ABC):  
    @abstractmethod  
    def execute(self, \*\*kwargs) \-\> Any:

*         pass  
  * Register new tools in ReActAgent dynamically (e.g., via a tool\_registry dictionary).

---

**4\. Implementation Strategy**

**4.1 Development Phases**

* **Setup and Configuration**:  
  * Create project structure (agent/, tools/, etc.).  
  * Configure DuckDB connection and environment variables (config.py).  
  * Set up logging and error handling framework.  
* **Tool Development**:  
  * Implement numerical tools in data\_tools.py (load\_csv\_to\_table, etc.).  
  * Implement text tools in text\_tools.py (analyze\_text, generate\_text\_report).  
  * Add unit tests for each tool using pytest.  
* **DuckDB Integration**:  
  * Implement DuckDBStorage class for table management.  
  * Test CSV loading, schema retrieval, and result storage.  
  * Validate read-only restrictions.  
* **Prompt Management**:  
  * Implement PromptManager with templates for reasoning, queries, and text analysis.  
  * Test prompts with sample data to ensure structured outputs.  
* **LangGraph ReAct Agent Development**:  
  * Build ReActAgent with nodes for reasoning, tool calls, and result aggregation.  
  * Integrate Grok 3 for reasoning and text analysis.  
  * Configure state to track table names, avoiding raw data.  
* **End-to-End Testing**:  
  * Test workflows combining numerical and textual analysis (e.g., load CSV, analyze text, group by theme, generate report).  
  * Validate error handling and recovery.  
* **Optimization**:  
  * Optimize pandas (vectorized operations), DuckDB (query planning), and LLM batching.  
  * Profile performance with sample CSVs (40–100 comments, numerical data).  
* **Deployment**:  
  * Package as a Python module with setup.py or pyproject.toml.  
  * Document usage in README.md with prompt examples and result access instructions.  
  * Ensure compliance with Grok 3 quotas.

**4.2 Testing Strategy**

* **Unit Tests**:  
  * Test each tool independently (e.g., load\_csv\_to\_table with valid/invalid CSVs).  
  * Mock LLM responses to avoid API calls during testing.  
* **Integration Tests**:  
  * Test workflows like “load CSV, analyze text, generate report, count themes.”  
  * Verify state management and data passing via table names.  
* **Performance Tests**:  
  * Test with CSVs of varying sizes (e.g., 100 rows, 1M rows).  
  * Measure LLM batching efficiency for text analysis.  
* **Security Tests**:  
  * Test read-only restrictions (e.g., attempt invalid UPDATE queries).  
  * Validate input sanitization for table names and queries.

**4.3 Deployment Considerations**

* **Environment**:  
  * Use Python 3.8+ for compatibility.  
  * Install dependencies via pip install \-r requirements.txt.  
* **Configuration**:  
  * Use .env file for settings (e.g., DUCKDB\_PATH=csv\_database.duckdb).  
  * Support command-line arguments for runtime options (e.g., python main.py \--prompt "analyze CSV").  
* **Monitoring**:  
  * Log tool calls and LLM responses to agent.log.  
  * Monitor Grok 3 API usage to stay within quotas.

---

**5\. Assumptions and Constraints**

* **CSV Size**: Assumes CSVs are small to medium (\<1GB) for pandas processing. Larger CSVs use DuckDB’s out-of-core capabilities.  
* **Text Data Volume**: Assumes 40–100 comments per CSV, manageable with batched LLM calls. Larger datasets may require BERTopic.  
* **Unique Identifiers**: Assumes CSVs have unique IDs (e.g., employee\_id) or uses pandas index for mapping text analysis results.  
* **LLM Availability**: Assumes access to Grok 3 (free tier or SuperGrok) or an alternative LLM. Quotas must be monitored.  
* **Prompt Clarity**: Assumes clear user prompts. Ambiguous prompts may require iterative clarification.  
* **Environment**: Assumes Python 3.8+ with required libraries.  
* **Concurrency**: Assumes single-user access. Multi-user support requires DuckDB file locking.

---

**6\. Risks and Mitigations**

* **Risk**: LLM generates incorrect queries or text analysis outputs.  
  * **Mitigation**: Validate queries and outputs (e.g., JSON format, valid sentiment values), prompt retries.  
* **Risk**: Token limits impact text analysis for large comment sets.  
  * **Mitigation**: Batch comments within analyze\_text and generate\_text\_report.  
* **Risk**: Memory issues with large CSVs in pandas.  
  * **Mitigation**: Use DuckDB’s streaming or chunked pandas reading.  
* **Risk**: Tool failures disrupt workflow.  
  * **Mitigation**: Robust error handling in tools and LangGraph.  
* **Risk**: Security vulnerabilities in DuckDB or queries.  
  * **Mitigation**: Enforce read-only access, validate inputs, secure files.  
* **Risk**: Grok 3 quota limits.  
  * **Mitigation**: Optimize prompts, consider alternative LLMs.

---

**7\. Future Enhancements**

* **Advanced Text Analysis**: Use transformers or spaCy for lightweight NLP to reduce LLM dependency.  
* **Interactive Reports**: Generate HTML reports with clickable citations.  
* **Theme Refinement**: Allow user feedback to refine themes.  
* **Query Optimization**: Enhance DuckDB and pandas performance.  
* **Visualization Tools**: Add plotting tools (e.g., matplotlib).  
* **Multi-User Support**: Configure DuckDB for concurrent access.  
* **Advanced Analytics**: Integrate NumPy, scikit-learn, or Polars.  
* **Caching**: Cache queries or schemas in DuckDB.

---

**8\. Conclusion**

This technical requirements document outlines a modular, maintainable, and extensible codebase for a self-calling AI agent using LangGraph’s ReAct framework, pandas, and DuckDB. The structure separates concerns (agent, tools, storage, prompts), adheres to best coding practices (PEP 8, type hints, logging), and supports numerical and textual analysis. Tools like analyze\_text and generate\_text\_report enable sentiment and theme extraction, with results integrated into DuckDB for downstream use. The design ensures scalability, security, and ease of future feature additions, providing a robust foundation for CSV analysis.  
