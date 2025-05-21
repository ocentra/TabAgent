// idbKnowledgeGraph.ts

// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.

import { BaseCRUD } from "./idbBase";
import { Embedding } from "./idbEmbedding";
import { DBNames } from "./idbSchema";
import { DBActions } from "./dbActions";

export class KnowledgeGraphNode extends BaseCRUD<KnowledgeGraphNode> {
  public type: string;
  public properties_json?: string;
  public embedding_id?: string;
  public created_at: number;
  public updated_at: number;
  protected modelWorker?: Worker;

  public edgesOut: KnowledgeGraphEdge[] = [];
  public edgesIn: KnowledgeGraphEdge[] = [];
  public embedding?: Embedding;

  constructor(
    id: string,
    type: string,
    label: string,
    dbWorker: Worker,
    created_at: number,
    updated_at: number,
    properties_json?: string,
    embedding_id?: string,
    modelWorker?: Worker
  ) {
    super(id, label, dbWorker);
    this.type = type;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.properties_json = properties_json;
    this.embedding_id = embedding_id;
    this.modelWorker = modelWorker;
  }

  get properties(): Record<string, any> | undefined {
    try {
        return this.properties_json ? JSON.parse(this.properties_json) : undefined;
    } catch (e) {
        console.error(`Failed to parse node properties_json for node ${this.id}:`, e);
        return undefined;
    }
  }

  set properties(data: Record<string, any> | undefined) {
    this.properties_json = data ? JSON.stringify(data) : undefined;
  }

  static async create(
    type: string,
    label: string,
    dbWorker: Worker,
    options: {
      id?: string;
      properties?: Record<string, any>;
      embeddingInput?: string;
      embeddingModel?: string;
      embeddingVector?: number[] | Float32Array | ArrayBuffer;
      modelWorker?: Worker;
    } = {}
  ): Promise<string> {
    const id = options.id || crypto.randomUUID();
    const now = Date.now();
    const properties_json = options.properties ? JSON.stringify(options.properties) : undefined;
    let embedding_id_to_set: string | undefined = undefined;

    if (options.embeddingInput && options.embeddingModel) {
        const existingEmbedding = await Embedding.getByInputAndModel(options.embeddingInput, options.embeddingModel, dbWorker);
        if (existingEmbedding) {
            embedding_id_to_set = existingEmbedding.id;
            if (options.embeddingVector !== undefined) {
                const vectorBuffer = Embedding.toArrayBuffer(options.embeddingVector);
                if (!KnowledgeGraphNode.areArrayBuffersEqual(vectorBuffer, existingEmbedding.vector)) {
                     await existingEmbedding.update({ vector: vectorBuffer });
                }
            }
        } else {
            let vectorToSave: ArrayBuffer;
            if (options.embeddingVector !== undefined) {
                vectorToSave = Embedding.toArrayBuffer(options.embeddingVector);
            } else if (options.modelWorker) {
                vectorToSave = await Embedding.generateVectorWithModelWorker(options.embeddingInput, options.embeddingModel, options.modelWorker);
            } else {
                throw new Error("KnowledgeGraphNode.create: Cannot create embedding - embeddingVector not provided and modelWorker is missing.");
            }
            embedding_id_to_set = await Embedding.create(options.embeddingInput, vectorToSave, options.embeddingModel, dbWorker);
        }
    }
    const nodeInstance = new KnowledgeGraphNode(id, type, label, dbWorker, now, now, properties_json, embedding_id_to_set, options.modelWorker);
    return nodeInstance.saveToDB();
  }

  static async read(id: string, dbWorker: Worker, modelWorker?: Worker): Promise<KnowledgeGraphNode | undefined> {
    const nodeData = await KnowledgeGraphNode.getKGNNodeData(id, dbWorker);
    if (nodeData) {
        return KnowledgeGraphNode.fromKGNData(nodeData, dbWorker, modelWorker);
    }
    return undefined;
  }

  static fromKGNData(data: any, dbWorker: Worker, modelWorker?: Worker): KnowledgeGraphNode {
      return new KnowledgeGraphNode(data.id, data.type, data.label, dbWorker, data.created_at, data.updated_at, data.properties_json, data.embedding_id, modelWorker);
  }

  static async getKGNNodeData(id: string, dbWorker: Worker): Promise<any | undefined> {
    const requestId = crypto.randomUUID();
    return new Promise<any | undefined>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success) {
            resolve(event.data.result);
          } else {
            reject(new Error(event.data.error || `Failed to get KGN node data (id: ${id})`));
          }
        }
      };
      dbWorker.addEventListener('message', handleMessage);
      dbWorker.postMessage({ action: DBActions.GET, payload: [DBNames.DB_USER_DATA, DBNames.DB_KNOWLEDGE_GRAPH_NODES, id], requestId });
      setTimeout(() => {
        dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for get KGN node data (id: ${id}) confirmation`));
      }, 5000);
    });
  }

  async update(updates: Partial<Omit<KnowledgeGraphNode, 'dbWorker' | 'modelWorker' | 'id' | 'created_at' | 'edgesOut' | 'edgesIn' | 'embedding' | 'type' >>): Promise<void> {
    const { id, dbWorker, modelWorker, created_at, edgesOut, edgesIn, embedding, type, ...allowedUpdates } = updates as any;
    if (allowedUpdates.properties && typeof allowedUpdates.properties === 'object') {
        this.properties = allowedUpdates.properties;
        delete allowedUpdates.properties;
    }
    Object.assign(this, allowedUpdates);
    await this.saveToDB();
  }

  async delete(options: { deleteOrphanedEmbedding?: boolean, deleteEdges?: boolean } = {}): Promise<void> {
    const { deleteOrphanedEmbedding = false, deleteEdges = true } = options;
    if (deleteEdges) {
        await this.deleteAllEdges();
    }
    if (deleteOrphanedEmbedding && this.embedding_id) {
        const emb = await Embedding.get(this.embedding_id, this.dbWorker);
        if (emb) {
            await emb.delete().catch(e => console.warn(`Attempted to delete embedding ${this.embedding_id}, but failed: ${e.message}`));
        }
    }
    const requestId = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(event.data.error || `Failed to delete KGN node data (id: ${this.id})`));
          }
        }
      };
      this.dbWorker.addEventListener('message', handleMessage);
      this.dbWorker.postMessage({ action: DBActions.DELETE, payload: [DBNames.DB_USER_DATA, DBNames.DB_KNOWLEDGE_GRAPH_NODES, this.id], requestId });
      setTimeout(() => {
        this.dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for delete KGN node data (id: ${this.id}) confirmation`));
      }, 5000);
    });
  }

  async saveToDB(): Promise<string> {
    const requestId = crypto.randomUUID();
    const now = Date.now();
    this.updated_at = now;
    if (!this.created_at) {
      this.created_at = now;
    }
    const { dbWorker, modelWorker, edgesOut, edgesIn, embedding, type, label, properties_json, embedding_id, created_at, updated_at, ...nodeSpecificsForStore } = this;
    
    const nodeDataForStore = {
        id: this.id, // Ensure id is part of the object if not captured by spread
        type: this.type,
        label: this.label,
        properties_json: this.properties_json,
        embedding_id: this.embedding_id,
        created_at: this.created_at,
        updated_at: this.updated_at,
    };

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else if (event.data.success) {
            reject(new Error('Node data saved, but worker did not return a valid ID.'));
          } else {
            reject(new Error(event.data.error || 'Failed to save node data'));
          }
        }
      };
      this.dbWorker.addEventListener('message', handleMessage);
      this.dbWorker.postMessage({
        action: DBActions.PUT,
        payload: [DBNames.DB_USER_DATA, DBNames.DB_KNOWLEDGE_GRAPH_NODES, nodeDataForStore],
        requestId
      });
      setTimeout(() => {
        this.dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for node data (id: ${this.id}) save confirmation`));
      }, 5000);
    });
  }

  async getEmbedding(): Promise<Embedding | undefined> {
    if (this.embedding && this.embedding.id === this.embedding_id) {
      return this.embedding;
    }
    if (this.embedding_id) {
      this.embedding = await Embedding.get(this.embedding_id, this.dbWorker);
      return this.embedding;
    }
    return undefined;
  }

  async addEdge(direction: 'out' | 'in', target_node_id: string, edge_type: string, metadata?: Record<string, any>): Promise<string> {
    const from_id = direction === 'out' ? this.id : target_node_id;
    const to_id = direction === 'out' ? target_node_id : this.id;
    const edgeId = await KnowledgeGraphEdge.create(from_id, to_id, edge_type, this.dbWorker, { metadata });
    return edgeId;
  }

  async fetchEdges(direction: 'out' | 'in' | 'both' = 'both'): Promise<void> {
    const fetchedEdges = await KnowledgeGraphEdge.getEdgesByNodeId(this.id, direction, this.dbWorker);
    if (direction === 'out') {
        this.edgesOut = fetchedEdges;
    } else if (direction === 'in') {
        this.edgesIn = fetchedEdges;
    } else {
        this.edgesOut = [];
        this.edgesIn = [];
        fetchedEdges.forEach(edge => {
            if (edge.from_node_id === this.id) this.edgesOut.push(edge);
            if (edge.to_node_id === this.id) {
                if (!this.edgesIn.find(e => e.id === edge.id) && !this.edgesOut.find(e => e.id === edge.id && edge.from_node_id === edge.to_node_id)) {
                    this.edgesIn.push(edge);
                } else if (edge.from_node_id !== this.id && !this.edgesIn.find(e => e.id === edge.id)) {
                    this.edgesIn.push(edge);
                }
            }
        });
    }
  }

  async deleteEdge(edgeId: string): Promise<boolean> {
    const edge = await KnowledgeGraphEdge.read(edgeId, this.dbWorker);
    if (edge && (edge.from_node_id === this.id || edge.to_node_id === this.id)) {
      await edge.delete();
      this.edgesOut = this.edgesOut.filter(e => e.id !== edgeId);
      this.edgesIn = this.edgesIn.filter(e => e.id !== edgeId);
      return true;
    }
    return false;
  }

  async deleteAllEdges(): Promise<void> {
    const allRelatedEdges = await KnowledgeGraphEdge.getEdgesByNodeId(this.id, 'both', this.dbWorker);
    const uniqueEdgeIds = Array.from(new Set(allRelatedEdges.map(e => e.id)));
    for (const edgeId of uniqueEdgeIds) {
        const edgeInstance = await KnowledgeGraphEdge.read(edgeId, this.dbWorker);
        if(edgeInstance) {
            await edgeInstance.delete();
        }
    }
    this.edgesOut = [];
    this.edgesIn = [];
  }

  static areArrayBuffersEqual(buf1: ArrayBuffer, buf2: ArrayBuffer): boolean {
      if (buf1.byteLength !== buf2.byteLength) return false;
      const view1 = new Uint8Array(buf1);
      const view2 = new Uint8Array(buf2);
      for (let i = 0; i < view1.length; i++) {
          if (view1[i] !== view2[i]) return false;
      }
      return true;
  }
}

export class KnowledgeGraphEdge extends BaseCRUD<KnowledgeGraphEdge> {
  public from_node_id: string;
  public to_node_id: string;
  public edge_type: string;
  public metadata_json?: string;
  public created_at: number;

  public fromNode?: KnowledgeGraphNode;
  public toNode?: KnowledgeGraphNode;

  constructor(
    id: string,
    from_node_id: string,
    to_node_id: string,
    edge_type: string,
    created_at: number,
    dbWorker: Worker,
    metadata_json?: string,
    fromNode?: KnowledgeGraphNode,
    toNode?: KnowledgeGraphNode
  ) {
    super(id, edge_type, dbWorker); // use edge_type as label for now
    this.from_node_id = from_node_id;
    this.to_node_id = to_node_id;
    this.edge_type = edge_type;
    this.metadata_json = metadata_json;
    this.created_at = created_at;
    if (fromNode) this.fromNode = fromNode;
    if (toNode) this.toNode = toNode;
  }

  get metadata(): Record<string, any> | undefined {
    try {
        return this.metadata_json ? JSON.parse(this.metadata_json) : undefined;
    } catch (e) {
        console.error(`Failed to parse edge metadata_json for edge ${this.id}:`, e);
        return undefined;
    }
  }

  set metadata(data: Record<string, any> | undefined) {
    this.metadata_json = data ? JSON.stringify(data) : undefined;
  }

  static async create(
    from_node_id: string,
    to_node_id: string,
    edge_type: string,
    dbWorker: Worker,
    options: { id?: string; metadata?: Record<string, any> } = {}
  ): Promise<string> {
    const id = options.id || crypto.randomUUID();
    const now = Date.now();
    const metadata_json = options.metadata ? JSON.stringify(options.metadata) : undefined;
    const edgeInstance = new KnowledgeGraphEdge(id, from_node_id, to_node_id, edge_type, now, dbWorker, metadata_json);
    return edgeInstance.saveToDB();
  }

  async saveToDB(): Promise<string> {
    const requestId = crypto.randomUUID();
    if (!this.created_at) {
        this.created_at = Date.now();
    }
    const { dbWorker, fromNode, toNode, ...edgeData } = this;
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else if (event.data.success) {
             reject(new Error('Edge saved, but worker did not return a valid ID.'));
          } else {
            reject(new Error(event.data.error || 'Failed to save edge'));
          }
        }
      };
      this.dbWorker.addEventListener('message', handleMessage);
      this.dbWorker.postMessage({
        action: DBActions.PUT,
        payload: [DBNames.DB_USER_DATA, DBNames.DB_KNOWLEDGE_GRAPH_EDGES, edgeData],
        requestId
      });
      setTimeout(() => {
        this.dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for edge (id: ${this.id}) save confirmation`));
      }, 5000);
    });
  }

  async update(updates: Partial<Omit<KnowledgeGraphEdge, 'dbWorker' | 'id' | 'created_at' | 'from_node_id' | 'to_node_id' | 'fromNode' | 'toNode'>>): Promise<void> {
    const { id, dbWorker, created_at, from_node_id, to_node_id, fromNode, toNode, ...allowedUpdates } = updates as any;
    if (allowedUpdates.metadata && typeof allowedUpdates.metadata === 'object') {
        this.metadata = allowedUpdates.metadata;
        delete allowedUpdates.metadata;
    }
    Object.assign(this, allowedUpdates);
    await this.saveToDB();
  }

  async delete(): Promise<void> {
    const requestId = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(event.data.error || `Failed to delete edge (id: ${this.id})`));
          }
        }
      };
      this.dbWorker.addEventListener('message', handleMessage);
      this.dbWorker.postMessage({ action: DBActions.DELETE, payload: [DBNames.DB_USER_DATA, DBNames.DB_KNOWLEDGE_GRAPH_EDGES, this.id], requestId });
      setTimeout(() => {
        this.dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for delete edge (id: ${this.id}) confirmation`));
      }, 5000);
    });
  }

  static async getEdgesByNodeId(nodeId: string, direction: 'out' | 'in' | 'both', dbWorker: Worker): Promise<KnowledgeGraphEdge[]> {
    const results: KnowledgeGraphEdge[] = [];
    const errors: Error[] = [];
    const fetchDirection = async (dir: 'out' | 'in') => {
        const requestId = crypto.randomUUID();
        const indexName = dir === 'out' ? 'from_node_id' : 'to_node_id';
        const queryObj = { from: DBNames.DB_KNOWLEDGE_GRAPH_EDGES, where: { [indexName]: nodeId }, orderBy: [{ field: indexName, direction: 'asc' }] };
        return new Promise<void>((resolveQuery, rejectQuery) => {
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && Array.isArray(event.data.result)) {
                        event.data.result.forEach((edgeData: any) => {
                            results.push(new KnowledgeGraphEdge(edgeData.id, edgeData.from_node_id, edgeData.to_node_id, edgeData.edge_type, edgeData.created_at, dbWorker, edgeData.metadata_json));
                        });
                        resolveQuery();
                    } else if (event.data.success) {
                        resolveQuery();
                    } else {
                        const err = new Error(event.data.error || `Failed to get edges for node ${nodeId}, direction ${dir}`);
                        errors.push(err);
                        rejectQuery(err);
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: DBActions.QUERY, payload: [DBNames.DB_USER_DATA, queryObj], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                const err = new Error(`Timeout for getEdgesByNodeId (node: ${nodeId}, dir: ${dir})`);
                errors.push(err);
                rejectQuery(err);
            }, 5000);
        });
    };
    if (direction === 'out' || direction === 'both') {
        await fetchDirection('out').catch(e => {});
    }
    if (direction === 'in' || direction === 'both') {
        await fetchDirection('in').catch(e => {});
    }
    if (errors.length > 0 && results.length === 0) {
        throw new Error(`Failed to fetch edges: ${errors.map(e => e.message).join(', ')}`);
    }
    if (direction === 'both' && results.length > 0) {
        return Array.from(new Map(results.map(edge => [edge.id, edge])).values());
    }
    return results;
  }

  /**
   * Fetch a single log entry by its unique ID.
   * For fetching all or filtered logs, use getAll or the filtering methods.
   */
  static async read(id: string, dbWorker: Worker): Promise<KnowledgeGraphEdge | undefined> {
    const requestId = crypto.randomUUID();
    return new Promise<KnowledgeGraphEdge | undefined>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success && event.data.result) {
            const edgeData = event.data.result;
            resolve(new KnowledgeGraphEdge(
              edgeData.id,
              edgeData.from_node_id,
              edgeData.to_node_id,
              edgeData.edge_type,
              edgeData.created_at,
              dbWorker,
              edgeData.metadata_json
            ));
          } else if (event.data.success && !event.data.result) {
            resolve(undefined);
          } else {
            reject(new Error(event.data.error || `Failed to get edge (id: ${id})`));
          }
        }
      };
      dbWorker.addEventListener('message', handleMessage);
      dbWorker.postMessage({ action: DBActions.GET, payload: [DBNames.DB_USER_DATA, DBNames.DB_KNOWLEDGE_GRAPH_EDGES, id], requestId });
      setTimeout(() => {
        dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for get edge (id: ${id}) confirmation`));
      }, 5000);
    });
  }
}
