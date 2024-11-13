/* eslint-disable no-console */
import { NodeType } from "./ast-node.js";
import { NODE_SCHEMA } from "./node-schema.js";

type NodeProperty =
  | ASTNode
  | ASTNodeList
  | string
  | string[]
  | number
  | boolean
  | null
  | undefined;

/* Base Node class */
export class ASTNode {
  type: NodeType;
  properties: Record<string, NodeProperty>;
  children?: ASTNode[];

  constructor(type: NodeType, properties?: Record<string, NodeProperty>) {
    this.type = type;
    this.properties = properties ?? {};
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
        const value: NodeProperty | undefined = this.properties[field];
        if (value instanceof ASTNode) {
          value.traverse(condition, callback);
        }
      }
    }
  }

  // Recursively prints all the nodes in the tree
  print(level = 0): void {
    const indent = "  ".repeat(level);
    console.log(`${indent}Node {`);
    console.log(`${indent}  type: '${this.type.toString()}',`);
    for (const property in this) {
      if (property !== "type" && property !== "children") {
        console.log(
          `${indent}  ${property}: ${JSON.stringify(this[property], null, 2).replace(/\n/gu, `\n${indent}  `)},`,
        );
      }
    }
    const children = this.children;
    if (children && children.length > 0) {
      console.log(`${indent}  children: [`);
      children.forEach((child: ASTNode) => {
        child.print(level + 2);
      });
      console.log(`${indent}  ]`);
    }
    console.log(`${indent}}`);
  }
}

/* Base NodeList class */
export class ASTNodeList extends ASTNode {
  override children: ASTNode[];

  constructor(type: NodeType, properties?: Record<string, NodeProperty>) {
    super(type, properties);
    this.children = [];
  }

  addChild(node: ASTNode): void {
    this.children?.push(node);
  }
}
