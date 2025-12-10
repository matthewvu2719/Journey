"""
Startup script that runs both the FastAPI app and the daily success scheduler
"""
import asyncio
import threading
import uvicorn
from daily_success_scheduler import daily_scheduler


def run_scheduler():
    """Run the scheduler in a separate thread"""
    print("Starting daily success rate scheduler...")
    daily_scheduler.start_scheduler()


def main():
    """Start both the API server and scheduler"""
    # Start scheduler in background thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    # Start FastAPI server
    print("Starting FastAPI server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["./"]
    )


if __name__ == "__main__":
    main()