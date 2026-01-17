---
globs: *.json
alwaysApply: false
---
# JSON File Editing with MCP Tools

When editing JSON files (especially translation files like messages/*.json, i18n files, or any JSON configuration), ALWAYS use the JSON Editor MCP tools instead of directly editing the files:

## Available Tools:
- `mcp_json_editor_read_multiple_json_values` - Read values from multiple JSON files
- `mcp_json_editor_write_json_values` - Write values to JSON files with automatic path creation
- `mcp_json_editor_merge_duplicate_keys` - Deep merge duplicate keys in JSON files
- `mcp_json_editor_delete_multiple_json_values` - Delete values from multiple JSON files

## CRITICAL: File Path Requirements

**ALWAYS use ABSOLUTE paths for file operations:**
- ✅ Correct: `C:\Users\DRISS\Desktop\eTOOLS\micro-tools\messages\ar.json`
- ❌ Wrong: `messages/ar.json`
- ❌ Wrong: `micro-tools/messages/ar.json`

**The workspace root is:** `C:\Users\DRISS\Desktop\eTOOLS`

## CRITICAL: Required Parameters

**For `mcp_json_editor_write_json_values`:**
- `filePath` (required): Absolute path to the JSON file
- `path` (required): Dot notation path (e.g., "tools.calculator")
- `value` (required): The value to write - MUST be provided, cannot be empty

**Example:**
```javascript
mcp_json_editor_write_json_values({
  filePath: "C:\\Users\\DRISS\\Desktop\\eTOOLS\\micro-tools\\messages\\ar.json",
  path: "tools.myTool",
  value: { "title": "عنوان", "description": "وصف" }
})
```

## Usage Guidelines:

### For Reading JSON Values:
```javascript
mcp_json_editor_read_multiple_json_values({
  filePaths: ["C:\\Users\\DRISS\\Desktop\\eTOOLS\\micro-tools\\messages\\en.json"],
  path: "common.welcome"
})
```

### For Writing JSON Values:
```javascript
mcp_json_editor_write_json_values({
  filePath: "C:\\Users\\DRISS\\Desktop\\eTOOLS\\micro-tools\\messages\\en.json",
  path: "common.greeting",
  value: "Hello World"
})
```

### For Writing Nested Objects:
```javascript
mcp_json_editor_write_json_values({
  filePath: "C:\\Users\\DRISS\\Desktop\\eTOOLS\\micro-tools\\messages\\ar.json",
  path: "tools.newTool",
  value: {
    "title": "أداة جديدة",
    "description": "وصف الأداة",
    "seo": {
      "whatIs": "ما هي هذه الأداة؟",
      "whatIsContent": "محتوى الشرح..."
    }
  }
})
```

### For Merging Duplicate Keys:
```javascript
mcp_json_editor_merge_duplicate_keys({
  filePath: "C:\\Users\\DRISS\\Desktop\\eTOOLS\\micro-tools\\messages\\en.json"
})
```

### For Deleting Values:
```javascript
mcp_json_editor_delete_multiple_json_values({
  filePaths: ["C:\\Users\\DRISS\\Desktop\\eTOOLS\\micro-tools\\messages\\en.json"],
  path: "tools.oldTool"
})
```

## When to Use These Tools:
- ✅ Editing translation files (messages/*.json)
- ✅ Updating configuration files
- ✅ Managing i18n/locale files
- ✅ Any JSON file manipulation
- ❌ Don't use for non-JSON files
- ❌ Don't manually edit JSON files (fsWrite, strReplace) when these tools are available

## Common Errors and Solutions:

### Error: "must have required property 'value'"
**Cause:** The `value` parameter was not provided
**Solution:** Always include the `value` parameter with the data to write

### Error: File not found
**Cause:** Using relative path instead of absolute path
**Solution:** Use full absolute path starting with `C:\Users\DRISS\Desktop\eTOOLS\`

## Important Notes:
- Always use ABSOLUTE paths (not relative paths)
- Dot notation paths work for nested objects (e.g., "tools.calculator.title")
- The tools preserve JSON formatting and structure
- Missing paths are created automatically when writing
- Deep merge preserves object structure while merging duplicates
- The `value` parameter is REQUIRED for write operations

This ensures consistent, reliable JSON file editing across the project.
