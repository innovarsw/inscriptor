# AgentChatTab Implementation Plan

# LH instructions:
- implement them into the plan
- all work will happen in new component that you create, AgentChatTab -
- you will probably use methods from prompt-store - especially use promptInternalSimple to call the AI prompts for the agent
- get inspiration from aiagent-store - there is already and agent there. Use getIndependentAgentTools to get the tools
- AgentChatTab logic implementation will be in aiagent-store
- The AgentChatTab will support multiple chats (but only one agent can run at a time) - like in the current ChatTab
- no chat history persistance will be needed, its stored only in memory
- no automatic tests - I will handle testing myself
- if you think you could implement more than this and I forgotten anything, ask me first

UI:
- in AgentChatTab - new chat button
- pagination with chats (like in AgentChatTab)
- reuse PromptResult component for text messages
- make new UI component for rendering the Tool Calls - create a new component, design-wise get inspired by PromptResult

## Implementation Plan

### 1. Store Layer (aiagent-store.js)

#### State Management
- Add agent chat state structure:
  ```javascript
  agentChats: {
    chats: [],           // Array of chat sessions
    activeChat: null,    // Current active chat
    isAgentRunning: false // Flag to prevent multiple agent runs
  }
  ```

#### Chat Structure
```javascript
{
  id: 'unique-id',
  messages: [
    {
      id: 'msg-id',
      role: 'user|assistant|system',
      content: 'message text',
      toolCalls: [], // For assistant messages with tool calls
      timestamp: Date.now()
    }
  ],
  createdAt: Date.now(),
  lastActivity: Date.now()
}
```

#### Core Actions
- `createAgentChat()` - Initialize new chat session
- `setActiveAgentChat(chatId)` - Switch between chats
- `deleteAgentChat(chatId)` - Remove chat from memory
- `addAgentMessage(chatId, message)` - Add message to specific chat
- `executeAgentPrompt(userMessage)` - Main agent execution logic
- `processToolCalls(toolCalls)` - Handle tool execution
- `updateAgentRunningState(isRunning)` - Manage agent execution state

### 2. UI Components

#### AgentChatTab.vue
Main container component with:
- Chat list/pagination controls
- Active chat display area
- Input area for user messages
- "New Chat" button
- Integration with aiagent-store

Key features:
- Watch for active chat changes
- Handle user input submission
- Display loading states during agent execution
- Prevent multiple simultaneous agent runs

#### ToolCallDisplay.vue
New component for rendering tool calls:
- Visual design inspired by PromptResult
- Display tool name, parameters, and results
- Collapsible/expandable view for complex results
- Status indicators (pending, executing, completed, failed)
- Use PromptResult component to render tool results/diffs

### 3. Integration Points

#### With prompt-store
- Use `promptInternalSimple` for AI prompt execution
- Pass system prompts for agent behavior
- No streaming responses for now (simplified implementation)

#### With getIndependentAgentTools
- Import and configure available tools
- Pass tools to AI prompt context
- Parse and execute tool calls from AI responses

### 4. Implementation Phases

#### Phase 1: Core Infrastructure
1. Extend aiagent-store with agent chat state
2. Implement basic chat CRUD operations
3. Create AgentChatTab component structure
4. Set up message display using PromptResult

#### Phase 2: Agent Execution
1. Implement executeAgentPrompt action
2. Integrate with promptInternalSimple
3. Add tool parsing logic
4. Implement processToolCalls with getIndependentAgentTools

#### Phase 3: UI Polish
1. Create ToolCallDisplay component
2. Add chat pagination
3. Implement loading states and error handling
4. Add keyboard shortcuts for better UX

#### Phase 4: Advanced Features
1. Tool execution feedback
2. Interrupt/cancel agent execution
3. Quick actions/commands

### 5. Technical Considerations

#### State Management
- Use Pinia store patterns consistent with existing stores
- Implement proper error boundaries
- Add loading states for async operations

#### Performance
- Limit number of chats in memory
- Implement virtual scrolling for long conversations
- Optimize re-renders with computed properties

#### User Experience
- Clear visual feedback during agent execution
- Intuitive chat switching
- Responsive design for different screen sizes
- Keyboard navigation support

### 6. Error Handling
- Network errors during AI calls
- Tool execution failures
- Invalid tool call formats
- Memory limits for chat storage
- Graceful degradation when tools unavailable

### 7. Future Extensibility
- Plugin system for custom tools
- Multi-agent conversations
- Tool result caching
- Agent behavior customization
- Streaming responses support
- Chat export/import (if persistence added later)
