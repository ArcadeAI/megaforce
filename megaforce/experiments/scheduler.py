import threading
import time
from datetime import datetime
from typing import Callable, Any, Optional
import heapq


class Scheduler:
    """
    A simple scheduler that can schedule callable functions to run at specific datetime instances.
    """

    def __init__(self):
        self._scheduled_tasks = []  # Min-heap of (timestamp, task_id, callable, args, kwargs)
        self._task_counter = 0
        self._running = False
        self._scheduler_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

    def schedule(self, func: Callable, run_at: datetime, *args, **kwargs) -> int:
        """
        Schedule a function to be called at a specific datetime.
        Args:
            func: The callable function to execute
            run_at: The datetime when the function should be called
            *args: Positional arguments to pass to the function
            **kwargs: Keyword arguments to pass to the function

        Returns:
            task_id: An integer ID for the scheduled task
        """
        if run_at <= datetime.now():
            raise ValueError("Cannot schedule a task in the past")

        with self._lock:
            task_id = self._task_counter
            self._task_counter += 1
            timestamp = run_at.timestamp()

            heapq.heappush(self._scheduled_tasks, (timestamp, task_id, func, args, kwargs))

        return task_id

    def start(self):
        """Start the scheduler in a background thread."""
        if self._running:
            return

        self._running = True
        self._stop_event.clear()
        self._scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._scheduler_thread.start()

    def stop(self):
        """Stop the scheduler and wait for the background thread to finish."""
        if not self._running:
            return

        self._running = False
        self._stop_event.set()

        if self._scheduler_thread:
            self._scheduler_thread.join()
            self._scheduler_thread = None

    def cancel_task(self, task_id: int) -> bool:
        """
        Cancel a scheduled task by its ID.

        Args:
            task_id: The ID of the task to cancel

        Returns:
            bool: True if task was found and cancelled, False otherwise
        """
        with self._lock:
            # Find and mark task as cancelled by replacing it with None
            for i, (timestamp, tid, func, args, kwargs) in enumerate(self._scheduled_tasks):
                if tid == task_id:
                    # Replace with a cancelled task marker
                    self._scheduled_tasks[i] = (timestamp, tid, None, None, None)
                    heapq.heapify(self._scheduled_tasks)  # Re-heapify after modification
                    return True
        return False

    def get_pending_tasks_count(self) -> int:
        """Get the number of pending (non-cancelled) tasks."""
        with self._lock:
            return sum(1 for _, _, func, _, _ in self._scheduled_tasks if func is not None)

    def _run_scheduler(self):
        """Main scheduler loop that runs in a background thread."""
        while self._running and not self._stop_event.is_set():
            current_time = time.time()

            with self._lock:
                # Process all tasks that are due
                while self._scheduled_tasks:
                    timestamp, task_id, func, args, kwargs = self._scheduled_tasks[0]

                    if timestamp > current_time:
                        # Next task is not due yet
                        break

                    # Remove the task from the heap
                    heapq.heappop(self._scheduled_tasks)

                    # Skip cancelled tasks (marked with func=None)
                    if func is None:
                        continue

                    # Execute the task in a separate thread to avoid blocking the scheduler
                    task_thread = threading.Thread(
                        target=self._execute_task,
                        args=(func, args, kwargs, task_id),
                        daemon=True
                    )
                    task_thread.start()

            # Sleep for a short interval before checking again
            self._stop_event.wait(0.1)

    def _execute_task(self, func: Callable, args: tuple, kwargs: dict, task_id: int):
        """Execute a scheduled task."""
        try:
            func(*args, **kwargs)
        except Exception as e:
            # In a production system, you might want to log this error
            print(f"Error executing task {task_id}: {e}")

    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop()


# Example usage:
if __name__ == "__main__":
    from datetime import timedelta

    def sample_task(message: str):
        print(f"[{datetime.now()}] Executing task: {message}")

    # Create and start scheduler - this runs in the background
    scheduler = Scheduler()
    scheduler.start()

    # Schedule a task to run in 5 seconds
    future_time = datetime.now() + timedelta(seconds=5)
    task_id = scheduler.schedule(sample_task, future_time, "Hello from scheduler!")

    print(f"Scheduled task {task_id} to run at {future_time}")
    print(f"Pending tasks: {scheduler.get_pending_tasks_count()}")
    print("Scheduler is running in the background. The main thread can continue...")

    # Main thread can continue doing other work here
    # The scheduled task will execute automatically in the background

    # Example: schedule multiple tasks
    for i in range(3):
        future = datetime.now() + timedelta(seconds=2 + i)
        scheduler.schedule(sample_task, future, f"Background task {i+1} will run at {future}")

    print(f"Total pending tasks: {scheduler.get_pending_tasks_count()}")
    print("Main thread continues... scheduled tasks will run automatically")

    # In a real application, you would do other work here instead of sleeping
    # For demonstration purposes only, we'll keep the program alive briefly
    try:
        import signal
        print("Press Ctrl+C to stop the scheduler and exit")
        signal.pause()  # Wait for interrupt signal instead of blocking sleep
    except KeyboardInterrupt:
        print("\nStopping scheduler...")
        scheduler.stop()
        print("Scheduler stopped.")
