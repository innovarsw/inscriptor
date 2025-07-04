# Search Tool Implementation Plan - Remaining Tasks

## Status
- ✅ Fuse.js dependency added to package.json
- ⏳ Tool definition needs to be added to getChatAgentTools()
- ⏳ executeSearchTool() method needs implementation
- ⏳ Tool routing needs to be added
- ⏳ Documentation needs updating

## Next Steps

### 1. Add Search Tool Definition to getChatAgentTools()

Location: `src/stores/aiagent-store.js` - in the `getChatAgentTools()` method, add after setFileSummary tool:

```javascript
{
  type: "function",
  function: {
    name: "search",
    description: "Search through all project files using exact or fuzzy matching",
    parameters: {
      type: "object",
      properties: {
        searchQuery: {
          type: "string",
          description: "The text to search for"
        },
        searchType: {
          type: "string",
          description: "Type of content to search in",
          enum: ["title", "content", "synopsis", "all"],
          default: "all"
        },
        fuzzySearch: {
          type: "boolean",
          description: "Enable fuzzy search for typo tolerance and approximate matching",
          default: false
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results to return",
          default: 20
        },
        threshold: {
          type: "number",
          description: "Fuzzy search sensitivity (0.0 = exact match, 1.0 = match anything)",
          default: 0.3
        }
      },
      required: ["searchQuery"]
    }
  }
}
```

### 2. Import Fuse.js at the top of aiagent-store.js

Add this import:
```javascript
import Fuse from 'fuse.js';
```

### 3. Implement executeSearchTool() Method

Add this method in `src/stores/aiagent-store.js` after `executeSetFileSummaryTool()`:

```javascript
executeSearchTool(args) {
  const { 
    searchQuery, 
    searchType = 'all', 
    fuzzySearch = false, 
    maxResults = 20, 
    threshold = 0.3 
  } = args;
  
  if (!searchQuery || !searchQuery.trim()) {
    return { error: "searchQuery parameter is required and cannot be empty" };
  }

  const fileStore = useFileStore();
  const allFiles = this.flattenFilesForSearch(fileStore.files);

  if (allFiles.length === 0) {
    return {
      success: true,
      content: "No files found in the project to search."
    };
  }

  let results;
  
  if (fuzzySearch) {
    results = this.performFuzzySearch(allFiles, searchQuery, searchType, threshold, maxResults);
  } else {
    results = this.performExactSearch(allFiles, searchQuery, searchType, maxResults);
  }

  return this.formatSearchResults(results, searchQuery, searchType, fuzzySearch);
},

flattenFilesForSearch(files, parentPath = '') {
  const flattened = [];
  
  for (const file of files) {
    const fullPath = parentPath ? `${parentPath} / ${file.title}` : file.title;
    
    flattened.push({
      id: file.id,
      title: file.title,
      content: file.content || '',
      synopsis: file.synopsis || '',
      fullPath: fullPath,
      originalFile: file
    });
    
    if (file.children && file.children.length > 0) {
      flattened.push(...this.flattenFilesForSearch(file.children, fullPath));
    }
  }
  
  return flattened;
},

performFuzzySearch(files, query, searchType, threshold, maxResults) {
  const searchFields = this.getSearchFields(searchType);
  
  const fuse = new Fuse(files, {
    keys: searchFields,
    threshold: threshold,
    includeScore: true,
    includeMatches: true
  });

  const fuseResults = fuse.search(query);
  return fuseResults.slice(0, maxResults).map(result => ({
    file: result.item,
    score: result.score,
    matches: result.matches,
    matchType: this.determineMatchType(result.matches)
  }));
},

performExactSearch(files, query, searchType, maxResults) {
  const queryLower = query.toLowerCase();
  const results = [];
  
  for (const file of files) {
    const matches = [];
    let matchType = '';
    
    if (searchType === 'all' || searchType === 'title') {
      if (file.title.toLowerCase().includes(queryLower)) {
        matches.push({ key: 'title', value: file.title });
        matchType = 'title';
      }
    }
    
    if (searchType === 'all' || searchType === 'content') {
      if (file.content.toLowerCase().includes(queryLower)) {
        matches.push({ key: 'content', value: file.content });
        if (!matchType) matchType = 'content';
      }
    }
    
    if (searchType === 'all' || searchType === 'synopsis') {
      if (file.synopsis.toLowerCase().includes(queryLower)) {
        matches.push({ key: 'synopsis', value: file.synopsis });
        if (!matchType) matchType = 'synopsis';
      }
    }
    
    if (matches.length > 0) {
      results.push({
        file: file,
        score: 0, // Exact matches have perfect score
        matches: matches,
        matchType: matchType
      });
    }
    
    if (results.length >= maxResults) break;
  }
  
  return results;
},

getSearchFields(searchType) {
  switch (searchType) {
    case 'title': return ['title'];
    case 'content': return ['content'];
    case 'synopsis': return ['synopsis'];
    case 'all': 
    default: return ['title', 'content', 'synopsis'];
  }
},

determineMatchType(matches) {
  if (!matches || matches.length === 0) return 'unknown';
  
  // Priority: title > synopsis > content
  if (matches.some(m => m.key === 'title')) return 'title';
  if (matches.some(m => m.key === 'synopsis')) return 'synopsis';
  if (matches.some(m => m.key === 'content')) return 'content';
  
  return matches[0].key;
},

formatSearchResults(results, query, searchType, fuzzySearch) {
  if (results.length === 0) {
    return {
      success: true,
      content: `No results found for "${query}" in ${searchType === 'all' ? 'any field' : searchType}.`
    };
  }

  let output = `SEARCH RESULTS for "${query}":\n`;
  output += `Search type: ${searchType}, Fuzzy: ${fuzzySearch ? 'enabled' : 'disabled'}\n`;
  output += `Found ${results.length} result(s)\n\n`;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const file = result.file;
    
    output += `${i + 1}. ${file.title}\n`;
    output += `   ID: ${file.id}\n`;
    output += `   Path: ${file.fullPath}\n`;
    output += `   Match type: ${result.matchType}\n`;
    
    if (fuzzySearch && result.score !== undefined) {
      output += `   Relevance: ${(1 - result.score).toFixed(2)}\n`;
    }
    
    // Add context snippet
    const snippet = this.createSearchSnippet(result, query);
    if (snippet) {
      output += `   Context: "${snippet}"\n`;
    }
    
    output += '\n';
  }

  return {
    success: true,
    content: output
  };
},

createSearchSnippet(result, query, maxLength = 150) {
  const file = result.file;
  const queryLower = query.toLowerCase();
  
  // Try to find the best snippet from matches
  if (result.matches && result.matches.length > 0) {
    for (const match of result.matches) {
      const text = file[match.key] || '';
      const index = text.toLowerCase().indexOf(queryLower);
      
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 50);
        let snippet = text.substring(start, end);
        
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        
        if (snippet.length > maxLength) {
          snippet = snippet.substring(0, maxLength - 3) + '...';
        }
        
        return snippet;
      }
    }
  }
  
  // Fallback: try to find query in any field
  for (const field of ['title', 'synopsis', 'content']) {
    const text = file[field] || '';
    const index = text.toLowerCase().indexOf(queryLower);
    
    if (index !== -1) {
      const start = Math.max(0, index - 30);
      const end = Math.min(text.length, index + query.length + 30);
      let snippet = text.substring(start, end);
      
      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';
      
      return snippet.length > maxLength ? snippet.substring(0, maxLength - 3) + '...' : snippet;
    }
  }
  
  return null;
}
```

### 4. Add Tool Routing

In the `executeChatAgentTool()` method, add this case before the default case:

```javascript
case 'search':
  return this.executeSearchTool(args);
```

### 5. Update Documentation

Update `specs/ai-agent-tools-implementation.md`:

1. Add to Project Tools section:
```markdown
4. **search** - Search through all project files with exact or fuzzy matching
   - Parameters: `searchQuery` (required), `searchType` (title/content/synopsis/all), `fuzzySearch` (boolean), `maxResults` (number), `threshold` (number)
```

2. Add to Tool Execution section:
```markdown
- `executeSearchTool()` - Performs exact or fuzzy search across all project files
```

3. Update TODO section:
```markdown
- [x] search tool (be inspired in file-store queryFiles - but feel free to create your own implementation suitable for tool calling)
```

## Implementation Notes

- The search tool will search across ALL files in the project (flattened hierarchy)
- Fuzzy search uses Fuse.js for typo tolerance and approximate matching
- Exact search uses simple string includes() for precise matching
- Results include context snippets showing where matches were found
- Search scores are provided for fuzzy search results
- File paths show the full hierarchy for better identification

## Testing

After implementation, test with:
1. Simple exact searches: `search({"searchQuery": "chapter"})`
2. Fuzzy searches: `search({"searchQuery": "chaptr", "fuzzySearch": true})`
3. Field-specific searches: `search({"searchQuery": "summary", "searchType": "synopsis"})`
4. Limited results: `search({"searchQuery": "text", "maxResults": 5})`