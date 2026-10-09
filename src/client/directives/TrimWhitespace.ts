
// Removes whitespace between inline elements. Empty text nodes ('') stay: Vue uses them as start and end
// anchors of fragments (v-for lists); without them reordering a list (e.g. a new turn order) crashes the
// update and the view stops refreshing until reload.
export function trimEmptyTextNodes(el: Node) {
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE && (node as Text).data !== '' && (node as Text).data.trim() === '') {
      node.remove();
      i--;
    }
  }
}
