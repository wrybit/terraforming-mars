import fs from 'fs';
import path from 'path';
import {parse} from '@vue/compiler-sfc';
import {ElementNode, ElementTypes, NodeTypes, TemplateChildNode} from '@vue/compiler-core';
import {normalizeText} from './localeFiles';

// Visible texts in Vue templates must go through the translation: either inside an element with
// v-i18n (src/client/directives/i18n.ts) or via $t(). This check finds texts that bypass it.

// Attributes a person reads (tooltip, input hint, screen reader); on native elements they are never translated
const READABLE_ATTRIBUTES = new Set(['title', 'placeholder', 'aria-label', 'alt']);
// Content of these elements is no visible text
const SKIPPED_TAGS = new Set(['svg', 'style', 'script', 'code', 'pre']);
// translateText leaves strings without a word untouched (numbers, symbols)
const HAS_WORD = /[A-Za-zÀ-ÿ]{2,}/;

export type TemplateCheckInput = {
  clientDir: string;
  rootDir: string;
  // English keys with a translation in at least one language
  knownKeys: ReadonlySet<string>;
  // "path/File.vue: text" entries that are intentionally not translated (names, key labels)
  allowlist: ReadonlySet<string>;
};

function vueFiles(dir: string): Array<string> {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return vueFiles(fullPath);
    }
    return entry.name.endsWith('.vue') ? [fullPath] : [];
  });
}

function hasDirective(element: ElementNode, name: string): boolean {
  return element.props.some((prop) => prop.type === NodeTypes.DIRECTIVE && prop.name === name);
}

function hasAttribute(element: ElementNode, name: string): boolean {
  return element.props.some((prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === name);
}

export function checkTemplates(input: TemplateCheckInput): Array<string> {
  const problems: Array<string> = [];
  for (const file of vueFiles(input.clientDir)) {
    const relativePath = path.relative(input.rootDir, file);
    const ast = parse(fs.readFileSync(file, 'utf8'), {filename: file}).descriptor.template?.ast;
    if (ast === undefined) {
      continue;
    }
    const report = (line: number, message: string, text: string) => {
      if (!input.allowlist.has(`${relativePath}: ${text}`)) {
        problems.push(`${relativePath}:${line}: ${message}: "${text}"`);
      }
    };
    const visit = (nodes: ReadonlyArray<TemplateChildNode>, translated: boolean) => {
      for (const node of nodes) {
        if (node.type === NodeTypes.TEXT) {
          const text = normalizeText(node.content);
          if (!HAS_WORD.test(text)) {
            continue;
          }
          if (!translated) {
            report(node.loc.start.line, 'text without v-i18n', text);
          } else if (!input.knownKeys.has(text)) {
            report(node.loc.start.line, 'no translation in any language', text);
          }
        } else if (node.type === NodeTypes.ELEMENT) {
          if (SKIPPED_TAGS.has(node.tag)) {
            continue;
          }
          // Components may translate their props themselves; native elements never do
          if (node.tagType === ElementTypes.ELEMENT) {
            for (const prop of node.props) {
              if (prop.type === NodeTypes.ATTRIBUTE && READABLE_ATTRIBUTES.has(prop.name) && HAS_WORD.test(prop.value?.content ?? '')) {
                report(prop.loc.start.line, `static ${prop.name}`, normalizeText(prop.value?.content ?? ''));
              }
            }
          }
          visit(node.children, translated || hasDirective(node, 'i18n') || hasAttribute(node, 'tm-has-i18n'));
        } else if (node.type === NodeTypes.IF) {
          for (const branch of node.branches) {
            visit(branch.children, translated);
          }
        } else if (node.type === NodeTypes.FOR) {
          visit(node.children, translated);
        }
      }
    };
    visit(ast.children, false);
  }
  return problems;
}
