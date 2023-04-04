import {DefaultTreeAdapterMap, parse, parseFragment, Parser, serialize} from "parse5";

const version = process.env.VERSION ?? "0";
const hash = process.env.HASH ?? "0";

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
    private cache;

    getDescendantByTag(node, tag) {
        for (let i = 0; i < node.childNodes?.length; i++) {
            if (node.childNodes[i].tagName === tag) return node.childNodes[i];

            const result = this.getDescendantByTag(node.childNodes[i], tag);
            if (result) return result;
        }

        return null;
    };

    addScript(filePath: string, isModule = true){
        const versionStr = `?v=${version}-${hash}`
        this.addInBody(`<script ${isModule ? `type="module"` : ""} src="${filePath + versionStr}"></script>`);
    }

    addStyle(filePath: string){
        const versionStr = `?v=${version}-${hash}`
        this.addInHead(`<link rel="stylesheet" href="${filePath + versionStr}">`);
    }

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
        if(!this.cache || process.env.NODE_ENV === "development") {
            this.cache = serialize(this.root);
        }
        return this.cache;
    }
}
