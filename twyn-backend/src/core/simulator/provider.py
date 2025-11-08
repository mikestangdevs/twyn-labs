import asyncio
from openai import AsyncOpenAI, ChatCompletion, OpenAI
from typing import List, Optional


class Provider:
    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
    ):
        """
        Initialize the provider with the given base URL and API key.
        This is a wrapper around the OpenAI API.

        Args:
            `api_key`: The API key for the provider (e.g. OpenAI, OpenRouter, etc.)
            `base_url`: The base URL for the provider (e.g. OpenRouter, Anthropic, etc.)
        """

        self.client = OpenAI(
            base_url=base_url,
            api_key=api_key,
        )

        self.async_client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
        )

    def completion(
        self,
        model: str,
        messages: List[dict],
        temperature: Optional[float] = None,
        response_format: Optional[type] = None,
    ) -> ChatCompletion:
        """
        Process a single completion request.

        Args:
            model: The model to use for completion
            messages: The messages to use for completion
            temperature: The temperature to use for completion
            response_format: Optional Pydantic model for structured parsing

        Returns:
            The completion of the request (ChatCompletion or Pydantic model)
        """
        if response_format:
            completion = self.client.beta.chat.completions.parse(
                model=model,
                messages=messages,
                temperature=temperature,
                response_format=response_format,
            )
        else:
            completion = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
            )

        return completion

    async def async_batch_completion(
        self,
        model: str,
        requests: List[dict],
        temperature: Optional[float] = None,
    ) -> List[dict]:
        """
        Process multiple completion requests asynchronously.

        Args:
            model: The model to use for completion
            requests: List of dicts with format {"id": str, "messages": List, "response_format": Optional[type]}
            temperature: Temperature parameter for completion

        Returns:
            List of dicts with format {"id": str, "messages": List, "completion": ChatCompletion or Pydantic model, "error": Optional[str]}
            If a request fails, the completion will be None and error will contain the error message.
        """

        async def process_request(request):
            try:
                response_format = request.get("response_format")
                if response_format:
                    completion = await self.async_client.beta.chat.completions.parse(
                        model=model,
                        messages=request["messages"],
                        temperature=temperature,
                        response_format=response_format,
                    )
                else:
                    completion = await self.async_client.chat.completions.create(
                        model=model,
                        messages=request["messages"],
                        temperature=temperature,
                    )
                return {
                    "id": request["id"],
                    "messages": request["messages"],
                    "response_format": response_format,
                    "completion": completion,
                    "error": None,
                }
            except Exception as e:
                error_msg = str(e)
                return {
                    "id": request["id"],
                    "messages": request["messages"],
                    "response_format": response_format,
                    "completion": None,
                    "error": error_msg,
                }

        # Create tasks for each request
        tasks = [process_request(request) for request in requests]

        # Gather all results, even if some fail
        results = await asyncio.gather(*tasks, return_exceptions=False)

        return results

    def batch_completion(
        self,
        model: str,
        requests: List[dict],
        temperature: Optional[float] = None,
    ) -> List[dict]:
        """
        Synchronous wrapper for batch completion requests.

        Args:
            model: The model to use for completion
            requests: List of dicts with format {"id": str, "messages": List, "response_format": Optional[type]}
            temperature: Temperature parameter for completion

        Returns:
            List of dicts with format {"id": str, "messages": List, "completion": ChatCompletion or Pydantic model, "error": Optional[str]}
            If a request fails, the completion will be None and error will contain the error message.
        """
        return asyncio.run(self.async_batch_completion(model, requests, temperature))
    
    # Vision & Multimodal Methods
    
    async def vlm_caption(
        self,
        image_bytes: bytes,
        prompt_hint: Optional[str] = None,
        model: Optional[str] = None
    ) -> str:
        """
        Generate image caption using vision language model.
        
        Args:
            image_bytes: Image data as bytes
            prompt_hint: Optional hint to guide caption generation
            model: Optional model override (defaults to VISION_MODEL env var)
        
        Returns:
            Caption text
        """
        import base64
        import os
        
        # Encode image to base64
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Use provided model or fall back to env var
        if model is None:
            model = os.getenv("VISION_MODEL", "anthropic/claude-3-5-sonnet-20241022")
        
        # Construct messages
        messages = [{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_b64}"
                    }
                },
                {
                    "type": "text",
                    "text": prompt_hint or "Describe this image in detail. Include key objects, people, text, and relationships."
                }
            ]
        }]
        
        # Call API
        response = await self.async_client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=int(os.getenv("VISION_MODEL_MAX_TOKENS", "4096"))
        )
        
        return response.choices[0].message.content
    
    async def vlm_ocr(
        self,
        image_bytes: bytes,
        extract_tables: bool = False,
        model: Optional[str] = None
    ) -> str:
        """
        Extract text from image using vision language model.
        
        Args:
            image_bytes: Image data as bytes
            extract_tables: If True, focus on table extraction
            model: Optional model override
        
        Returns:
            Extracted text
        """
        if extract_tables:
            prompt = "Extract all text from this image, preserving table structure in markdown format. Include headers and all cells."
        else:
            prompt = "Extract all text from this image. Preserve formatting, structure, and layout as much as possible."
        
        return await self.vlm_caption(image_bytes, prompt, model)
    
    async def vlm_entities(
        self,
        image_bytes: bytes,
        schema_hint: Optional[dict] = None,
        model: Optional[str] = None
    ) -> List[dict]:
        """
        Extract entities from image.
        
        Args:
            image_bytes: Image data as bytes
            schema_hint: Optional hint about what entities to extract
            model: Optional model override
        
        Returns:
            List of entity dictionaries
        """
        import json
        
        if schema_hint:
            prompt = f"Extract entities from this image matching this schema: {json.dumps(schema_hint)}. Return as JSON array."
        else:
            prompt = "Identify and extract all key entities in this image (objects, people, places, text, numbers). Return as JSON array with format: [{\"type\": \"...\", \"value\": \"...\", \"confidence\": 0-1}]"
        
        response = await self.vlm_caption(image_bytes, prompt, model)
        
        # Try to parse JSON response
        try:
            # Extract JSON from markdown code blocks if present
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0].strip()
            else:
                json_str = response
            
            entities = json.loads(json_str)
            return entities
        except:
            # Fallback: return raw text as single entity
            return [{"type": "raw_text", "value": response, "confidence": 0.5}]
    
    async def generate_embedding(
        self,
        text: str,
        model: Optional[str] = None
    ) -> List[float]:
        """
        Generate text embedding for semantic search.
        
        Args:
            text: Text to embed
            model: Optional model override (defaults to EMBEDDING_MODEL env var)
        
        Returns:
            Embedding vector
        """
        import os
        
        if model is None:
            model = os.getenv("EMBEDDING_MODEL", "openai/text-embedding-3-small")
        
        response = await self.async_client.embeddings.create(
            model=model,
            input=text
        )
        
        return response.data[0].embedding