import json
import copy
import traceback
from openai import AsyncOpenAI
from rich.console import Console
from agents import RunContextWrapper
from pprint import pformat
from typing import Any, Optional, Protocol

# Initialize rich console
console = Console()

class ContextCallback(Protocol):
    """Protocol for context change callbacks"""
    async def on_context_change(
        self,
        context: Any,
    ):
        """Called when context is changed by the agent"""
        pass

class Agent:
    def __init__(
            self, 
            instructions: str, 
            model: str, 
            tools: list,
            visible_context_field: str,
            base_url: str, 
            api_key: str,
            context_callback: Optional[ContextCallback] = None,
        ):
        self.instructions = instructions
        self.model = model
        self.tools = tools
        self.visible_context_field = visible_context_field
        self.is_anthropic_model = "anthropic" in self.model.lower()
        self.context_callback = context_callback

        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key
        )

        self.messages = [
            {
                "role": "system", 
                "content": [
                    {
                        "type": "text",
                        "text": instructions,
                    }
                ]
            }, 
        ]

        # If using an Anthropic model, add cache_control to the system message content
        if self.is_anthropic_model:
            self.messages[0]["content"][0]["cache_control"] = {
                "type": "ephemeral"
            }

        self.tool_map = {tool.name: tool for tool in self.tools}

    def _format_tools(self):
        formatted_tools = []
        for tool in self.tools:
            formatted_tools.append({
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.params_json_schema
                }
            })
        
        return formatted_tools

    async def _call_llm(self, current_context):
        formatted_tools = self._format_tools()
                
        # Start with a deep copy of the messages
        messages_copy = copy.deepcopy(self.messages)
        messages_copy.append({
            "role": "assistant",
            "content": f"Latest {self.visible_context_field}:\n{pformat(getattr(current_context, self.visible_context_field), indent=4)}"
        })

        # Set extra headers for Anthropic models
        extra_headers = {}
        if self.is_anthropic_model:
            extra_headers["anthropic-beta"] = "token-efficient-tools-2025-02-19"

        # Generate content with tool support
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages_copy,
            tools=formatted_tools,
            tool_choice="auto",
            extra_headers=extra_headers,
        )

        return response
        
    async def _execute_tool(self, tool_name, tool_args_str, tool_call_id, current_context):
        """Execute a tool and return the result, error message if any, and updated context."""
        result = None
        error_msg = None
        ctx = None
        
        try:
            if tool_name in self.tool_map:
                tool = self.tool_map[tool_name]
                ctx_wrapper = RunContextWrapper(current_context)
                result = await tool.on_invoke_tool(ctx_wrapper, tool_args_str)
                ctx = ctx_wrapper.context
                
                # Call context callback if context was changed and callback exists
                if ctx and self.context_callback:
                    await self.context_callback.on_context_change(context=ctx)

                if isinstance(result, dict):
                    self.messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call_id,
                            "name": tool_name,
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"plot_name: '{result['title']}'"
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{result['image']}"
                                    }
                                },
                            ]
                        }
                    )
                    result = f"plot_name: '{result['title']}'"
                else:
                    self.messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call_id,
                            "name": tool_name,
                            "content": json.dumps({"result": str(result)}),
                        }
                    )
            else:
                error_msg = f"Unknown tool call: {tool_name}"
                # Call context callback with error if callback exists
                if self.context_callback:
                    await self.context_callback.on_context_change(context=current_context)
                self.messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call_id,
                        "name": tool_name,
                        "content": json.dumps({"error": error_msg}),
                    }
                )

        except Exception as e:
            # print the full traceback
            import traceback
            print(traceback.format_exc())
            error_msg = f"Error executing {tool_name}: {e}.\nContinuing..."
            # Call context callback with error if callback exists
            if self.context_callback:
                await self.context_callback.on_context_change(context=current_context)
            self.messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call_id,
                    "name": tool_name,
                    "content": json.dumps({"error": error_msg}),
                }
            )
            
        return result, error_msg, ctx
        
    async def run(
            self,
            input: list,
            context: dict = {},
            max_turns: int = 10, 
        ):
        current_context = context

        self.messages.extend(input)

        turn = 0
        
        while True:
            console.rule(f"[yellow]Agent Loop {turn+1}/{max_turns}[/yellow]")
            turn += 1

            if turn >= max_turns:
                console.print("[yellow]Warning: Reached maximum compute loops without final query[/yellow]")
                raise Exception(f"Maximum compute loops reached: {turn}/{max_turns}")

            try:
                response = await self._call_llm(current_context)

                if response.choices:
                    assert len(response.choices) == 1
                    message = response.choices[0].message

                    if message.tool_calls and len(message.tool_calls) > 0:
                        self.messages.append(
                            {
                                "role": "assistant",
                                "tool_calls": [
                                    {
                                        "id": tool_call.id,
                                        "type": "function",
                                        "function": tool_call.function,
                                    } for tool_call in message.tool_calls
                                ],
                            }
                        )

                        for tool_call in message.tool_calls:
                            tool_name = tool_call.function.name
                            tool_args_str = tool_call.function.arguments

                            console.print(f"[blue]Tool Call:[/blue] {tool_name}")
                            
                            result, error_msg, ctx = await self._execute_tool(tool_name, tool_args_str, tool_call.id, current_context)
                            if ctx:
                                current_context = ctx
                                
                            if error_msg:
                                console.print(f"[red]{error_msg}[/red]")
                            else:
                                console.print(
                                    f"[blue]Tool Call Result:[/blue] {tool_name}(...) -> {str(result)[:120]}..."
                                )
                    else:
                        return
                else:
                    from pprint import pprint
                    console.print(f"[red]No response from LLM[/red]")
                    pprint(self.messages)
                    pprint(response)

            except Exception as e:
                raise Exception(f"{traceback.format_exc()}\n{response}")

