FROM langchain/langgraph-api:3.11



RUN PYTHONDONTWRITEBYTECODE=1 uv pip install --system --no-cache-dir -c /api/constraints.txt langgraph>=0.2.20 langgraph-sdk>=0.1.0 langgraph-cli[inmem]>=0.3.0 langchain>=0.3.0 langchain-core>=0.3.0 langchain-openai>=0.2.0 pandas duckdb python-dotenv fastapi uvicorn supabase pyjwt psycopg2-binary redis numpy textblob scikit-learn pytest pytest-asyncio black python-multipart

# -- Adding local package . --
ADD . /deps/Ver0.2
# -- End of local package . --

# -- Installing all local dependencies --
RUN PYTHONDONTWRITEBYTECODE=1 uv pip install --system --no-cache-dir -c /api/constraints.txt -e /deps/*
# -- End of local dependencies install --
ENV LANGGRAPH_HTTP='{"app": "/deps/Ver0.2/agent/custom_app.py:app"}'
ENV LANGSERVE_GRAPHS='{"dashboard_agent": "agent.agent:agent"}'



# -- Ensure user deps didn't inadvertently overwrite langgraph-api
RUN mkdir -p /api/langgraph_api /api/langgraph_runtime /api/langgraph_license && touch /api/langgraph_api/__init__.py /api/langgraph_runtime/__init__.py /api/langgraph_license/__init__.py
RUN PYTHONDONTWRITEBYTECODE=1 uv pip install --system --no-cache-dir --no-deps -e /api
# -- End of ensuring user deps didn't inadvertently overwrite langgraph-api --
# -- Removing build deps from the final image ~<:===~~~ --
RUN pip uninstall -y pip setuptools wheel
RUN rm -rf /usr/local/lib/python*/site-packages/pip* /usr/local/lib/python*/site-packages/setuptools* /usr/local/lib/python*/site-packages/wheel* && find /usr/local/bin -name "pip*" -delete || true
RUN rm -rf /usr/lib/python*/site-packages/pip* /usr/lib/python*/site-packages/setuptools* /usr/lib/python*/site-packages/wheel* && find /usr/bin -name "pip*" -delete || true
RUN uv pip uninstall --system pip setuptools wheel && rm /usr/bin/uv /usr/bin/uvx

WORKDIR /deps/Ver0.2