/* Imports */
import { NodeType } from "./ast-node.js";
import { NODE_SCHEMA } from "./node-schema.js";

/* Constants */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeMethod = (...args: any[]) => any;
export type NodeProperty =
  | ASTNode
  | ASTNodeList
  | string
  | string[]
  | number
  | boolean
  | null
  | undefined
  | ASTNode[]
  | NodeMethod;
export interface NodeProperties {
  [key: string]: NodeProperty;
}

/**
 * Base class for AST nodes.
 */
export class ASTNode {
  public readonly type: NodeType;
  public readonly children?: ASTNode[];
  [key: string]: NodeProperty;

  /**
   * Creates an instance of ASTNode.
   * @param type - The type of the node.
   * @param properties - Additional properties to set on the node.
   */
  constructor(type: NodeType) {
    this.type = type;
  }

  /**
   * Traverses the AST and applies a callback to nodes that match the condition.
   * @param condition - A function that returns true for nodes to be processed.
   * @param callback - A function to apply to matching nodes.
   */
  public traverse(
    condition: (node: ASTNode) => boolean,
    callback: (node: ASTNode) => void,
  ): void {
    if (condition(this)) {
      callback(this);
    }
    if (this instanceof ASTNodeList) {
      for (const child of this.children) {
        child.traverse(condition, callback);
      }
    } else {
      const schemaFields = NODE_SCHEMA[this.type];
      for (const field of schemaFields) {
        const value = this[field] as unknown;
        if (value instanceof ASTNode) {
          value.traverse(condition, callback);
        }
      }
    }
  }

  /**
   * Recursively prints all the nodes in the tree.
   */
  public print(): void {
    // eslint-disable-next-line no-console
    console.dir(this, { depth: null });
  }
}

/**
 * Base class for AST node lists.
 */
export class ASTNodeList extends ASTNode {
  public override readonly children: ASTNode[];

  /**
   * Creates an instance of ASTNodeList.
   * @param type - The type of the node list.
   * @param children - Child nodes to add to the node list.
   */
  constructor(type: NodeType, children?: ASTNode[]) {
    super(type);
    this.children = children ?? [];
  }

  /**
   * Adds a child node to the node list.
   * @param node - The child node to add.
   * @returns The current instance for chaining.
   */
  public addChild(node: ASTNode): this {
    this.children.push(node);
    return this;
  }

  /**
   * Adds multiple child nodes to the node list.
   * @param nodes - The child nodes to add.
   * @returns The current instance for chaining.
   */
  public addChildren(nodes: ASTNode[]): this {
    this.children.push(...nodes);
    return this;
  }

  /**
   * Removes a child node from the node list.
   * @param node - The child node to remove.
   * @returns The current instance for chaining.
   */
  public removeChild(node: ASTNode): this {
    const index = this.children.indexOf(node);
    if (index === -1) {
      throw new Error("Node not found");
    }
    this.children.splice(index, 1);
    return this;
  }

  /**
   * Removes multiple child nodes from the node list.
   * @param nodes - The child nodes to remove.
   * @returns The current instance for chaining.
   */
  public removeChildren(nodes: ASTNode[]): this {
    for (const node of nodes) {
      this.removeChild(node);
    }
    return this;
  }
}
