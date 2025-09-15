# 🤖 Dashboard Analysis Agent

A self-calling AI agent built with LangGraph that autonomously analyzes data tables, performs numerical and textual analysis, and generates comprehensive reports.

## 🌟 Features

- **Autonomous Analysis**: Multi-step reasoning using LangGraph's ReAct agent
- **Data Table Processing**: Query and analyze existing data tables using pandas + DuckDB
- **Text Analysis**: Sentiment analysis and theme extraction
- **Real-time Streaming**: Live updates via LangGraph SDK API
- **Modern React UI**: Chat interface with streaming responses
- **Supervisor Architecture**: Built with `create_react_agent` for robust tool orchestration

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│ LangGraph SDK API│◄──►│ ReAct Agent     │
│   (useStream)   │    │   (Streaming)    │    │ (create_react)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Analysis Tools │
                                                │ • Data Querying │
                                                │ • Text Analysis │
                                                │ • Report Gen    │
                                                └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   DuckDB        │
                                                │   Storage       │
                                                └─────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone or create project directory
cd Ver0.2

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your API keys
```

### 2. Configure Environment

Edit `.env` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
```

### 3. Start the Agent API

```bash
# Start LangGraph server
langgraph serve

# Server runs on http://localhost:2024
```

### 4. Frontend Setup (Next Phase)

```bash
cd frontend
npm install
npm run dev
```

## 🔧 Agent Capabilities

The agent can autonomously:

1. **Explore Data Tables**: `get_table_names()` and `get_table_schema(table_name)`
2. **Query Data**: `execute_pandas_query(table_name, operation)` with flexible output modes
3. **Analyze Text**: `analyze_text_data(table_name, text_column)` with multi-task support
4. **Generate Reports**: `generate_analysis_report(table_name)`
5. **Create Data Pipelines**: Build intermediate tables for complex multi-step analyses

## 💬 Example Interactions

**User**: "Analyze this customer survey CSV for sentiment by department"

**Agent Process**:
```
🔧 Loading CSV into database...
📊 Analyzing table schema...  
🔍 Performing sentiment analysis on comments...
📈 Grouping results by department...
📋 Generating comprehensive report...
```

## 📁 Project Structure

```
dashboard-agent/
├── agent/                    # Agent implementation
│   ├── __init__.py
│   ├── agent.py             # Main ReAct agent  
│   ├── config.py            # Configuration
│   ├── prompts.py           # Agent instructions
│   └── tools/               # Analysis tools
│       ├── csv_tools.py     # CSV operations
│       ├── analysis_tools.py # Data analysis
│       ├── report_tools.py  # Report generation
│       └── storage_tools.py # DuckDB management
├── frontend/                # React application (next phase)
├── data/                    # Database storage
├── langgraph.json          # LangGraph configuration
├── requirements.txt        # Python dependencies
└── .env                    # Environment variables
```

## 🛠️ Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black agent/
```

### Local Development
```bash
# Start in development mode with hot reload
langgraph serve --watch
```

## 📚 Documentation

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangGraph SDK](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/)
- [Agent Tools Reference](./agent/tools/README.md)

## 🎯 Implementation Status

1. ✅ **Phase 1**: Project Setup & Dependencies
2. ✅ **Phase 2**: CSV Analysis Tools (pandas + DuckDB)
3. ✅ **Phase 3**: ReAct Agent with create_react_agent  
4. ✅ **Phase 4**: LangGraph SDK API Serving
5. ✅ **Phase 5**: React Frontend with Streaming
6. ✅ **Phase 6**: Integration Testing & Optimization

## 🚀 Quick Start

### Automated Setup

```bash
# Run the automated setup script
python setup.py
```

### Manual Setup

1. **Install Dependencies**
```bash
pip install -r requirements.txt
cd frontend && npm install
```

2. **Configure Environment**
```bash
# Copy and edit environment file
cp .env.template .env
# Add your OpenAI API key to .env
```

3. **Start Backend**
```bash
python start_server.py
```

4. **Start Frontend** (new terminal)
```bash
cd frontend
npm run dev
```

5. **Test the System**
```bash
python test_integration.py
```

### Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:2024
- **Playground**: http://localhost:2024/playground

## 📄 License

MIT License - see LICENSE file for details. 