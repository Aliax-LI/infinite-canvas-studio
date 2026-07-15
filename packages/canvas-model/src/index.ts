export const canvasSchemaVersion = 1;

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasNode<TProperties = Record<string, unknown>> {
  id: string;
  type: string;
  position: CanvasPoint;
  size: { width: number; height: number };
  properties: TProperties;
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
}

export interface CanvasDocument {
  schemaVersion: number;
  id: string;
  title: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: { x: number; y: number; zoom: number };
  revision: number;
}
