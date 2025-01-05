/* Imports */
import { NodeType } from "./ast-node.js";

/* Constants */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeMethod = (...arguments_: any[]) => any;
export type TraversableFields = readonly string[];
export type NodeProperty =
  | string
  | string[]
  | number
  | boolean
  | undefined
  | ASTNode
  | ASTNode[]
  | ASTNodeList
  | NodeMethod
  | TraversableFields;
export interface NodeProperties {
  [key: string]: NodeProperty;
}

/**
 * Base class for AST nodes.
 */
export abstract class ASTNode {
  public readonly type: NodeType;
  public readonly children?: ASTNode[];
  public abstract readonly traversableFields: TraversableFields;
  [key: string]: NodeProperty;

  /**
   * Creates an instance of ASTNode.
   * @param type The type of the node.
   */
  constructor(type: NodeType) {
    this.type = type;
  }

  /**
   * Traverses the AST and applies a callback to nodes that match the condition.
   * @param condition A function that returns true for nodes to be processed.
   * @param callback A function to apply to matching nodes.
   */
  public traverse(
    condition: (node: ASTNode) => boolean,
    callback: (node: ASTNode) => void,
  ): void {
    if (condition(this)) {
      callback(this);
    }
    const nodeTraversableFields = this.traversableFields;
    for (const field of nodeTraversableFields) {
      const value = this[field] as unknown;
      if (value instanceof ASTNode) {
        value.traverse(condition, callback);
      }
    }
  }

  /**
   * Recursively prints all the nodes in the tree.
   */
  public print(): void {
    // eslint-disable-next-line no-console
    console.dir(this, { depth: undefined });
  }
}

/**
 * Base class for AST node lists.
 */
export abstract class ASTNodeList extends ASTNode {
  public override readonly traversableFields = [];

  /**
   * Creates an instance of ASTNodeList.
   * @param type The type of the node list.
   * @param children Child nodes to add to the node list.
   */
  constructor(
    type: NodeType,
    public override readonly children: ASTNode[] = [],
  ) {
    super(type);
  }

  /**
   * Traverses the AST and applies a callback to nodes that match the condition.
   * @param condition A function that returns true for nodes to be processed.
   * @param callback A function to apply to matching nodes.
   */
  public override traverse(
    condition: (node: ASTNode) => boolean,
    callback: (node: ASTNode) => void,
  ): void {
    if (condition(this)) {
      callback(this);
    }

    for (const child of this.children) {
      child.traverse(condition, callback);
    }
    return;
  }

  /**
   * Adds a child node to the node list.
   * @param node The child node to add.
   * @returns The current instance for chaining.
   */
  public addChild(node: ASTNode): this {
    this.children.push(node);
    return this;
  }

  /**
   * Adds multiple child nodes to the node list.
   * @param nodes The child nodes to add.
   * @returns The current instance for chaining.
   */
  public addChildren(nodes: ASTNode[]): this {
    this.children.push(...nodes);
    return this;
  }

  /**
   * Removes a child node from the node list.
   * @param node The child node to remove.
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
   * @param nodes The child nodes to remove.
   * @returns The current instance for chaining.
   */
  public removeChildren(nodes: ASTNode[]): this {
    for (const childNode of nodes) {
      this.removeChild(childNode);
    }
    return this;
  }
}
