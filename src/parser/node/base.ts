/* eslint-disable no-console */
import { NODE_SCHEMA } from "./node-schema.js";

/* Base Node class */
export class Node {
  type: string;
  [key: string]: any;

  constructor(type: string, properties?: { [key: string]: any }) {
    this.type = type;
    if (properties) {
      for (const property in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, property)) {
          this[property] = properties[property];
        }
      }
    }
  }

  traverse(
    condition: (node: Node) => boolean,
    callback: (node: Node) => void,
  ): void {
    if (condition(this)) {
      callback(this);
    }
    if (this instanceof NodeList) {
      for (const child of this.children) {
        child.traverse(condition, callback);
      }
    } else {
      const schemaFields = NODE_SCHEMA[this.type];
      if (!schemaFields) {
        throw new Error(
          `Node type '${this.type}' is not defined in the schema.`,
        );
      }
      for (const field of schemaFields) {
        if (this[field]) {
          this[field].traverse(condition, callback);
        }
      }
    }
  }

  // Recursively prints all the nodes in the tree
  print(level: number = 0): void {
    const indent = "  ".repeat(level);
    console.log(`${indent}Node {`);
    console.log(`${indent}  type: '${this.type}',`);
    for (const property in this) {
      if (property !== "type" && property !== "children") {
        console.log(
          `${indent}  ${property}: ${JSON.stringify(this[property], null, 2).replace(/\n/gu, `\n${indent}  `)},`,
        );
      }
    }
    if (this["children"]?.length > 0) {
      console.log(`${indent}  children: [`);
      this["children"].forEach((child: Node) => child.print(level + 2));
      console.log(`${indent}  ]`);
    }
    console.log(`${indent}}`);
  }
}

/* Base NodeList class */
export class NodeList extends Node {
  children: Node[];

  constructor(type: string, properties?: { [key: string]: any }) {
    super(type, properties);
    this.children = [];
  }

  addChild(node: Node): void {
    this.children.push(node);
  }
}
