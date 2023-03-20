import {DefaultTreeAdapterMap, parse, parseFragment, Parser, serialize} from "parse5";

export default class HTML {
    parser = new Parser();
    root: DefaultTreeAdapterMap['document'] = parse(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
</body>
</html>`);
    head = this.getDescendantByTag(this.root, "head");
    body = this.getDescendantByTag(this.root, "body");

    getDescendantByTag(node, tag) {
        for (let i = 0; i < node.childNodes?.length; i++) {
            if (node.childNodes[i].tagName === tag) return node.childNodes[i];

            const result = this.getDescendantByTag(node.childNodes[i], tag);
            if (result) return result;
        }

        return null;
    };

    addInHead(contentHTML: string) {
        parseFragment(contentHTML).childNodes.forEach(node => {
            this.parser.treeAdapter.appendChild(this.head, node)
        });
    }

    addInBody(contentHTML: string) {
        parseFragment(contentHTML).childNodes.forEach(node => {
            this.parser.treeAdapter.appendChild(this.body, node)
        });
    }

    toString(){
        return serialize(this.root)
    }
}
