# AI Agent Tools Implementation Specs

## Overview
The AI agent system implements multiple types of intelligent agents that can interact with documents and projects through structured tool calls. The system supports both independent agents (that work autonomously) and chat agents (that maintain conversation context).

## Architecture

### Core Components
- **Store**: `src/stores/aiagent-store.js` - Central state management for all agent operations
- **UI Component**: `src/components/RightMenu/AgentChatTab.vue` - Chat interface for agent interactions
- **Tool Display**: `src/components/RightMenu/ToolCallDisplay.vue` - Visual representation of tool calls

## Agent Types

### 1. Independent Agents
Autonomous agents that analyze documents and suggest modifications without user interaction until confirmation is needed.

**Features:**
- Analyze entire document structure with node IDs
- Generate tool calls for modifications
- Present suggestions through confirmation widget
- Continue autonomously until completion

### 2. Chat Agents
Conversational agents that maintain dialogue context and respond to user messages with tool capabilities.

**Features:**
- Multiple chat histories
- Multi-turn conversations
- Tool-enhanced responses
- Real-time interaction

## Available Tools

### Document Tools
1. **getCurrentDocument** - Retrieves current document content with node IDs
2. **modifyParagraph** - Modifies specific paragraph by node ID
   - Parameters: `nodeId`, `newContent`, `reasoning`
3. **stop** - Signals agent completion with reasoning

### Project Tools
1. **listProjectFiles** - Lists all project files with metadata
2. **readFile** - Reads specific file content or synopsis
   - Parameters: `fileId`, `readType` (full/synopsis)
3. **setFileSummary** - Sets the synopsis/summary for a specific file
   - Parameters: `fileId`, `synopsis`
4. **search** - Search through all project files with exact or fuzzy matching
   - Parameters: `searchQuery` (required), `searchType` (title/content/synopsis/all), `fuzzySearch` (boolean), `maxResults` (number), `threshold` (number)

## Tool Call Processing

### Chat Agent Flow
1. User sends message through AgentChatTab
2. Message added to chat history
3. AI generates response with potential tool calls
4. Tools executed and results added to conversation
5. Response displayed with tool call visualizations

### Independent Agent Flow
1. Agent analyzes full document
2. Generates tool calls for modifications
3. Each tool call creates confirmation widget
4. User approves/rejects modifications
5. Agent continues until completion or stop

## Tool Call Structure
```javascript
{
  function: {
    name: "toolName",
    arguments: "JSON string of parameters"
  },
  id: "unique_tool_call_id"
}
```

## State Management

### Agent Chat State
```javascript
agentChats: {
  chats: [],           // Array of chat sessions
  activeChat: null,    // Current active chat ID
  isAgentRunning: false // Prevent concurrent executions
}
```

### Tool Call Display
- Expandable UI showing tool name, parameters, and results
- Color-coded icons for different tool types
- Friendly names for technical tool names

## Key Methods

### Chat Management
- `createAgentChat()` - Creates new chat session
- `executeAgentPrompt()` - Processes user message with AI
- `processAgentToolCalls()` - Handles tool execution

### Tool Execution
- `executeChatAgentTool()` - Routes tool calls to appropriate handlers
- `executeGetCurrentDocumentTool()` - Returns document with node IDs
- `executeModifyParagraphTool()` - Validates and prepares paragraph modifications
- `executeListProjectFilesTool()` - Returns formatted project file structure
- `executeReadFileTool()` - Reads file content or synopsis based on readType
- `executeSetFileSummaryTool()` - Sets file synopsis using file store method
- `executeSearchTool()` - Performs exact or fuzzy search across all project files

## Integration Points

### With Editor
- Retrieves document content with node structure
- Applies modifications through confirmation widgets
- Manages paragraph decorations during processing

### With File System
- Access to project file hierarchy
- File content and metadata retrieval
- Synopsis and full content reading capabilities

## Future Extensibility

The tool system is designed for easy expansion:

1. **New Tools**: Add tool definitions to `getChatAgentTools()`
2. **Tool Handlers**: Implement execution methods in `executeChatAgentTool()`
3. **UI Enhancement**: Extend `ToolCallDisplay.vue` for new tool types
4. **Agent Types**: Add new agent patterns following existing structure

## Error Handling

- Tool call validation before execution
- Graceful degradation for unknown tools
- Error messages added to chat history
- Abort mechanisms for long-running operations

## Security Considerations

- Tool parameters validated before execution
- Node ID verification for document modifications
- Sandboxed tool execution environment
- User confirmation required for destructive operations


# TODO:
- [x] add setFileSummary function that sets file.synopsis (using the apropriate file-store method)
- [x] search tool (be inspired in file-store queryFiles - but feel free to create your own implementation suitable for tool calling)
- [x] fix setFileSummary context awareness - tool should be aware of current active file and not set synopsis for wrong file when user is working on different file

## Future Tool Enhancements

### Document Structure Tools
- [ ] insertParagraph - Insert new paragraphs at specific positions in document
- [ ] deleteParagraph - Remove paragraphs from document
- [ ] moveParagraph - Reorder paragraphs within document
- [ ] mergeParagraphs - Combine multiple paragraphs into one
- [ ] splitParagraph - Split a paragraph at specific position

### File Management Tools
- [ ] createFile - Create new files with templates and metadata
- [ ] deleteFile - Remove files from project
- [ ] moveFile - Change file hierarchy/parent relationships
- [ ] duplicateFile - Create copies of existing files
- [ ] setFileMetadata - Update file properties (title, icon, labels, state)

### Content Analysis Tools
- [ ] analyzeDocument - Get document statistics, readability metrics
- [ ] findInconsistencies - Detect plot holes, character inconsistencies
- [ ] extractEntities - Identify characters, locations, themes
- [ ] generateOutline - Create structured outlines from content

### Cross-Reference Tools
- [ ] findReferences - Find mentions of characters/topics across files
- [ ] createCrossReference - Generate reference maps between files
- [ ] validateContinuity - Check timeline and story consistency

### Template & Style Tools
- [ ] applyTemplate - Apply writing templates to files
- [ ] analyzeWritingStyle - Assess tone, voice, style consistency
- [ ] suggestImprovements - Provide writing enhancement suggestions

### Project Organization Tools
- [ ] reorganizeProject - Suggest/implement project structure improvements
- [ ] createChapterStructure - Generate chapter breakdown from content
- [ ] exportSelection - Export specific files/sections in various formats
