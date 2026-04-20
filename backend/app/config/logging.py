"""Logging configuration module for InterviewPilot backend."""

import logging
import sys
from pathlib import Path
from datetime import datetime
import os
import json

import structlog
from structlog.stdlib import LoggerFactory
from structlog.processors import (
    JSONRenderer,
    TimeStamper,
    StackInfoRenderer,
    format_exc_info,
    UnicodeEncoder,
)


def get_log_level() -> str:
    """Get log level from environment variable."""
    return os.getenv("LOG_LEVEL", "INFO").upper()


def get_log_dir() -> Path:
    """Get log directory path, create if not exists."""
    log_dir = Path(__file__).parent.parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    return log_dir


def get_log_file_path() -> Path:
    """Get current log file path with date suffix."""
    log_dir = get_log_dir()
    date_str = datetime.now().strftime("%Y-%m-%d")
    return log_dir / f"app-{date_str}.log"


def cleanup_old_logs(max_days: int = 7) -> None:
    """Remove log files older than max_days."""
    log_dir = get_log_dir()
    cutoff_date = datetime.now().timestamp() - (max_days * 24 * 60 * 60)

    for log_file in log_dir.glob("app-*.log"):
        if log_file.stat().st_mtime < cutoff_date:
            log_file.unlink()


class StructlogFormatter(logging.Formatter):
    """Custom formatter to use structlog JSON rendering for stdlib logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_dict = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info:
            log_dict["exc_info"] = self.formatException(record.exc_info)

        for key, value in record.__dict__.items():
            if key not in [
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "thread",
                "threadName",
                "exc_info",
                "exc_text",
                "stack_info",
                "message",
                "asctime",
            ]:
                log_dict[key] = value

        return json.dumps(log_dict)


def setup_file_handler() -> logging.FileHandler:
    """Setup file handler with JSON format."""
    log_file = get_log_file_path()
    handler = logging.FileHandler(log_file, encoding="utf-8")
    handler.setFormatter(StructlogFormatter())
    handler.setLevel(get_log_level())
    return handler


def setup_console_handler() -> logging.StreamHandler:
    """Setup console handler with colored output."""
    handler = logging.StreamHandler(sys.stdout)

    colors = {
        "DEBUG": "\033[36m",
        "INFO": "\033[32m",
        "WARNING": "\033[33m",
        "ERROR": "\033[31m",
        "CRITICAL": "\033[35m",
    }

    class ColoredFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            color = colors.get(record.levelname, "")
            reset = "\033[0m"
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            return f"{color}[{timestamp}] [{record.levelname}] [{record.name}] {record.getMessage()}{reset}"

    handler.setFormatter(ColoredFormatter())
    handler.setLevel(get_log_level())
    return handler


def configure_structlog() -> None:
    """Configure structlog with processors pipeline."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            TimeStamper(fmt="iso"),
            StackInfoRenderer(),
            format_exc_info,
            UnicodeEncoder(),
            JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.getLogger().level),
        logger_factory=LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def init_logging() -> None:
    """Initialize logging configuration for the application."""
    cleanup_old_logs()

    root_logger = logging.getLogger()
    root_logger.setLevel(get_log_level())
    root_logger.handlers.clear()

    root_logger.addHandler(setup_file_handler())
    root_logger.addHandler(setup_console_handler())

    configure_structlog()

    logger = get_logger("logging")
    logger.info(
        "logging_initialized", log_level=get_log_level(), log_dir=str(get_log_dir())
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structlog logger instance."""
    return structlog.get_logger(name)
