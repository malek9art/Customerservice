import { Injectable, SetMetadata } from '@nestjs/common';

export const AI_TOOL_METADATA = 'AI_TOOL_METADATA';

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: any;
  requiredPermissions: string[];
}

export const AiTool = (definition: AiToolDefinition) =>
  SetMetadata(AI_TOOL_METADATA, definition);

@Injectable()
export class AiToolRegistry {
  private tools = new Map<string, AiToolDefinition>();

  register(name: string, definition: AiToolDefinition) {
    this.tools.set(name, definition);
  }

  getTool(name: string) {
    return this.tools.get(name);
  }

  getAllTools() {
    return Array.from(this.tools.values());
  }
}
