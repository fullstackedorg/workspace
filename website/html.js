import { Parser, parse, serialize } from "parse5";
import { readFileSync } from "fs";

export function buildHTMLPage(htmlFile, watchScript = null){
    const parser = new Parser();

    const html = parse(readFileSync(htmlFile).toString());
    const body = getDescendantByTag(html, "body");

    watchScript?.childNodes.forEach(node => {
        parser.treeAdapter.appendChild(body, node);
    });

    return serialize(html);
}

function getDescendantByTag(node, tag) {
    for (let i = 0; i < node.childNodes?.length; i++) {
        if (node.childNodes[i].tagName === tag) return node.childNodes[i];

        const result = getDescendantByTag(node.childNodes[i], tag);
        if (result) return result;
    }

    return null;
};