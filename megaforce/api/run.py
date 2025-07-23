#!/usr/bin/env python3
"""
Simple script to run the FastAPI application.
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "stream_agent.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )