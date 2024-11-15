/* Imports */
import { NodeType } from "./ast-node.js";
import { NODE_SCHEMA } from "./node-schema.js";

/* Constants */
const RESERVED_PROPERTIES = ["type", "children"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NodeMethod = (...args: any[]) => any;
type NodeProperty =
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

interface NodeProperties {
  [key: string]: NodeProperty;
}

/* Base Node class */
export class ASTNode {
  type: NodeType;
  children?: ASTNode[];
  [key: string]: NodeProperty;

  constructor(type: NodeType, properties?: NodeProperties) {
    this.type = type;
    if (properties) {
      for (const key in properties) {
        if (RESERVED_PROPERTIES.includes(key)) {
          throw new Error(
            `Property '${key}' is reserved and cannot be set on ASTNode.`,
          );
        }
        this[key] = properties[key];
      }
    }
  }

  traverse(
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
      const schemaFields: string[] | undefined = NODE_SCHEMA[this.type];
      if (!schemaFields) {
        throw new Error(
          `Node type '${this.type.toString()}' is not defined in the schema.`,
        );
      }
      for (const field of schemaFields) {
        const value = this[field];
        if (value instanceof ASTNode) {
          value.traverse(condition, callback);
        }
      }
    }
  }

  // Recursively prints all the nodes in the tree
  print(): void {
    // eslint-disable-next-line no-console
    console.dir(this, { depth: null });
  }
}

/* Base NodeList class */
export class ASTNodeList extends ASTNode {
  override children: ASTNode[];

  constructor(
    type: NodeType,
    properties?: Record<string, NodeProperty>,
    children?: ASTNode[],
  ) {
    super(type, properties);
    this.children = children ?? [];
  }

  addChild(node: ASTNode): this {
    this.children.push(node);
    return this;
  }
  addChildren(nodes: ASTNode[]): this {
    this.children.push(...nodes);
    return this;
  }
  removeChild(node: ASTNode): this {
    const index = this.children.indexOf(node);
    if (index !== -1) {
      this.children.splice(index, 1);
    } else {
      throw new Error("Node not found");
    }
    return this;
  }
  removeChildren(nodes: ASTNode[]): this {
    for (const node of nodes) {
      this.removeChild(node);
    }
    return this;
  }
}
