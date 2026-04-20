import os
import time
from typing import AsyncGenerator, Optional
import httpx
import json
import structlog
import structlog.contextvars as contextvars
from ..config import get_settings
from ..config.logging import get_logger

settings = get_settings()


class LLMService:
    def __init__(self):
        self.api_url = settings.DASHSCOPE_API_URL
        self.api_key = settings.DASHSCOPE_API_KEY or os.getenv("DASHSCOPE_API_KEY")
        self.model = settings.DASHSCOPE_MODEL
        self.max_tokens = settings.LLM_MAX_TOKENS
        self.temperature = settings.LLM_TEMPERATURE
        self.timeout = settings.LLM_TIMEOUT
        self.logger = get_logger("llm_service")

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        start_time = time.time()
        prompt_length = len(prompt)
        response_length = 0

        self.logger.info(
            "llm_call_start",
            model=self.model,
            prompt_length=prompt_length,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=True,
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.api_url}/chat/completions",
                    headers=headers,
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                data = json.loads(line[6:])
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        response_length += len(content)
                                        yield content
                            except json.JSONDecodeError:
                                continue

            duration_ms = int((time.time() - start_time) * 1000)
            self.logger.info(
                "llm_call_end",
                duration_ms=duration_ms,
                response_length=response_length,
                stream=True,
            )
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.logger.error(
                "llm_call_error",
                error_type=type(e).__name__,
                error_message=str(e),
                duration_ms=duration_ms,
                exc_info=True,
            )
            raise

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        start_time = time.time()
        prompt_length = len(prompt)

        self.logger.info(
            "llm_call_start",
            model=self.model,
            prompt_length=prompt_length,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=False,
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                result = data["choices"][0]["message"]["content"]

            duration_ms = int((time.time() - start_time) * 1000)
            response_length = len(result)
            self.logger.info(
                "llm_call_end",
                duration_ms=duration_ms,
                response_length=response_length,
                stream=False,
            )
            return result
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.logger.error(
                "llm_call_error",
                error_type=type(e).__name__,
                error_message=str(e),
                duration_ms=duration_ms,
                exc_info=True,
            )
            raise
