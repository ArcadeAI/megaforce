FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies and uv
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip install uv

# Copy project files
COPY pyproject.toml uv.lock README.md ./

# Install dependencies with uv
RUN uv sync --frozen

# Copy the entire project (for imports to work)
COPY . .

# Set Python path to include the current directory for imports
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
# Use shell form to reference $PORT which Render sets at runtime
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD sh -c "curl -fsS http://localhost:${PORT}/health || exit 1"

# Run the application
# Respect $PORT at runtime (Render sets this automatically)
CMD ["sh", "-c", "uv run uvicorn api.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers"]
