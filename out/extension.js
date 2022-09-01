"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ scheme: "file", language: "wdlang" }, new WdDocumentSymbolProvider()));
}
exports.activate = activate;
class WdDocumentSymbolProvider {
    provideDocumentSymbols(document, token) {
        return new Promise((resolve, reject) => {
            const symbols = [];
            const key_names = { "<|": "widgets", "-|": "varibles", ".|": "presets", "{|": "configures", "[|": "commands" };
            const content_kind = { commands: vscode.SymbolKind.Function };
            const values_exept = { tk_name: vscode.SymbolKind.Struct, tk_type: vscode.SymbolKind.TypeParameter, preset: vscode.SymbolKind.Namespace };
            let type_content = undefined;
            let node_hierarchy = [];
            function pack_children_simboly(simboly) {
                node_hierarchy[node_hierarchy.length - 1]["children"].push(simboly);
            }
            function set_place_simboly(simboly) {
                if (node_hierarchy.length == 0) {
                    symbols.push(simboly);
                }
                // push, as children
                else {
                    pack_children_simboly(simboly);
                }
                node_hierarchy.push(simboly);
            }
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const text = line.text;
                const var_value = text.match(/.*[:].*/g) || [];
                const open_brackets = text.match(/[-.<{[]\|/g) || [];
                const close_brackets = text.match(/\|[-.>}\]]/g) || [];
                if (open_brackets.length > 0) {
                    const name = key_names[open_brackets[0]];
                    const node = new vscode.DocumentSymbol(name, open_brackets[0], vscode.SymbolKind.Class, line.range, line.range);
                    set_place_simboly(node);
                    type_content = content_kind[name] || vscode.SymbolKind.Variable;
                }
                if (close_brackets.length > 0) {
                    const self_range = node_hierarchy[node_hierarchy.length - 1].range;
                    node_hierarchy[node_hierarchy.length - 1]["range"] = new vscode.Range(new vscode.Position(self_range.start.line, self_range.start.line), new vscode.Position(line.range.end.line, line.range.end.character));
                    node_hierarchy = node_hierarchy.splice(0, node_hierarchy.length - 1);
                    type_content = undefined;
                }
                if (var_value.length > 0 && type_content) {
                    const var_name = text.slice(0, text.indexOf(":")).trim();
                    let type_key;
                    if (var_name in values_exept) {
                        type_key = values_exept[var_name];
                    }
                    else {
                        type_key = type_content;
                    }
                    const var_node = new vscode.DocumentSymbol(var_name, "", type_key, line.range, line.range);
                    pack_children_simboly(var_node);
                }
            }
            resolve(symbols);
        });
    }
}
//# sourceMappingURL=extension.js.map