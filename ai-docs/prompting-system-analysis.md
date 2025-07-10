# Prompting System Analysis

## Overview

This document analyzes the prompting system architecture in Inscriptor, covering how prompts are executed, how tools are integrated, and the flow from request to response.

## Core Architecture

### System Components

1. **promptHelper.js** - Request orchestration and parameter handling
2. **prompt-store.js** - Prompt execution engine and API integration
3. **aiagent-store.js** - Tool definitions and agent capabilities

## Prompt Execution Flow

### 1. Request Initiation (`promptHelper.js`)

**Entry Point**: `executePromptClick2(request)`
- Determines if parameter selection dialog should be shown
- Sets up context (current file, selected text, etc.)
- Routes to appropriate execution method based on prompt type

**Confirmation Flow**: `executeConfirmPrompt2(request)`
- Handles user-confirmed prompt requests
- Manages context types and user inputs
- Delegates to execution methods

**Execution Methods**:
- `executePrompt2(request)` - For general, insert, selection prompts
- `executeChatPrompt2(request)` - For chat-type prompts

### 2. Core Execution (`prompt-store.js`)

#### Main Execution Method: `promptMultiple2(request)`
**Location**: Lines 136-247

**Key Responsibilities**:
- Orchestrates entire prompt execution flow
- Handles multiple prompt runs with different configurations
- Manages abort controllers for cancellation
- Processes variable replacement (`$output.{runName}`)
- Integrates with AI agent system
- Calculates result diffs and manages UI updates

**Execution Flow**:
```javascript
1. Validate request with canPromptRequest()
2. Handle preview-only mode
3. Create/manage prompt result pages
4. Execute prompt runs (single or multiple iterations)
5. Process results through AI agents
6. Return final result with metadata
```

#### Internal Execution Methods

**`promptInternalSimple(request)` - Non-Streaming Execution**
**Location**: Lines 1071-1155

**Purpose**: Primarily used by AI agents for tool-enabled prompts
**Key Features**:
- Direct OpenAI API calls without streaming
- **Tool Integration Point**: Passes `input.tools` to OpenAI API
- Handles authentication with Firebase tokens
- Returns complete responses synchronously

```javascript
const completion = await openai.chat.completions.create({
  model: model.modelName,
  messages: messages,
  tools: input.tools,  // Critical: Tools passed here
  temperature: input.temperature,
  // ... other parameters
});
```

**`promptInternalStreaming(request)` - Streaming Execution**
**Location**: Lines 1156-1669

**Purpose**: Real-time response generation with multiple engine support
**Execution Engines**:
- **Cloud**: Custom `promptStream` service
- **Client-OpenAI**: Direct OpenAI API calls
- **Ollama**: Local model execution
- **LMStudio**: Local model execution

**Note**: Current streaming implementation has limited tool support in OpenAI client section.

#### Input Construction: `constructPromptInput2(request)`
**Location**: Lines 341-1037

**Responsibilities**:
- Processes context replacement (`$selection`, `$textOrSelection`, `$context`)
- Handles message formatting for different prompt types
- Applies model-specific settings and parameters
- **Critical**: Extracts and includes tools from request

**Tool Integration**:
```javascript
const tools = request.tools; // Extract tools from request
return {
  // ... other input properties
  tools  // Include tools in input object
}
```

## Tool System Architecture

### Tool Definition (`aiagent-store.js`)

#### Available Tools

**Document Tools**:
- `getCurrentDocument` - Get current document with paragraph node IDs
- `modifyParagraph` - Modify specific paragraphs with reasoning

**Project Tools**:
- `listProjectFiles` - List all project files with hierarchy/metadata
- `readFile` - Read file content (full or synopsis)
- `setFileSummary` - Set file synopsis/summary
- `search` - Search through project files (exact/fuzzy matching)

#### Tool Definition Format
```javascript
{
  type: "function",
  function: {
    name: "toolName",
    description: "Tool description with usage guidance",
    parameters: {
      type: "object",
      properties: {
        param1: { type: "string", description: "Parameter description" }
      },
      required: ["param1"]
    }
  }
}
```

### Tool Execution Flow

1. **Tool Request**: AI includes `tool_calls` in response
2. **Tool Routing**: `executeChatAgentTool(toolCall)` routes to specific handlers
3. **Tool Execution**: Individual tool methods execute and return results
4. **Result Processing**: Tool results added to conversation context
5. **Response Generation**: AI generates follow-up response with tool context

### Tool Execution Methods

**Chat Agent Tools** (`executeChatAgentTool`):
- Routes tool calls to appropriate handlers
- Returns structured results with success/error status
- Handles user confirmations for destructive operations

**Independent Agent Tools** (`executeIndependentAgentTool`):
- Similar routing for independent agent workflows
- Supports `modifyParagraph` and `stop` tools
- Manages agent state and progression

## Request/Response Data Structures

### Request Object Structure
```javascript
{
  prompt: promptObject,           // Prompt definition
  text: "user input",            // User text input
  tools: [toolDefinitions],      // Available tools
  contextTypes: [contexts],      // Context providers
  userInputs: [inputs],          // User input sources
  parametersValue: [params],     // Prompt parameters
  abortController: controller,   // Cancellation handling
  // ... additional metadata
}
```

### Response Processing
```javascript
{
  completionResponse: {
    choices: [{
      message: {
        content: "AI response text",
        tool_calls: [                    // Tool calls to execute
          {
            id: "call_123",
            function: {
              name: "toolName",
              arguments: "{\"param\":\"value\"}"
            }
          }
        ]
      }
    }]
  }
}
```

## Context System

### Context Types
- **Current File**: Active document content
- **Selected Text**: User's text selection
- **Project Files**: File hierarchy and metadata
- **Custom Contexts**: User-defined context providers

### Context Application
- Context is resolved during `constructPromptInput2`
- Replaced in prompts using variables like `$selection`, `$context`
- Different contexts available based on prompt type and user selection

## Integration Patterns

### 1. Simple Prompt Execution
```
User Input → executePromptClick2 → promptMultiple2 → promptInternalStreaming → API Response → UI Update
```

### 2. Tool-Enhanced Prompt Execution
```
User Input → AI Agent → promptInternalSimple → Tool Calls → Tool Execution → Response Generation → UI Update
```

### 3. Agent Workflow
```
Agent Start → Document Analysis → Tool Calls → User Confirmation → Tool Execution → Next Iteration/Completion
```

## Key Implementation Details

### Authentication
- Uses Firebase ID tokens for cloud API calls
- Handles local model authentication separately
- Manages API keys through secure storage

### Error Handling
- Abort controllers for request cancellation
- Graceful degradation for unsupported features
- User notifications via Quasar Notify system
- Comprehensive error logging and debugging

### Performance Considerations
- Streaming responses for real-time user feedback
- Efficient context management and caching
- Optimized tool execution with minimal overhead
- Smart pagination and result limiting

## Tool Integration Recommendations

Based on the analysis, a `runPredefinedPrompt` tool would integrate seamlessly into this architecture:

1. **Tool Definition**: Add to `getChatAgentTools()` in aiagent-store.js
2. **Execution Handler**: Create `executeRunPredefinedPromptTool()` method
3. **Prompt Execution**: Use existing `promptInternalSimple()` with predefined prompt
4. **Result Processing**: Return formatted results to conversation context

This would enable AI agents to leverage the full prompt library as sub-tools, making them infinitely extensible through user-created prompts.