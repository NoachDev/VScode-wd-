import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext){
  context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({scheme: "file", language: "wdlang"}, new WdDocumentSymbolProvider()));
}

class WdDocumentSymbolProvider implements vscode.DocumentSymbolProvider{
  public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.DocumentSymbol[] | vscode.SymbolInformation[]> {
    return new Promise((resolve, reject) => {
        const symbols :vscode.DocumentSymbol[] = [];

        const    key_names  : {[key: string]: string}           = {"<|": "widgets", "-|" : "varibles", ".|" : "presets", "{|" : "configures", "[|" : "commands"};
        
        const content_kind  : Record<string, vscode.SymbolKind> = {commands: vscode.SymbolKind.Function};
        const values_exept  : Record<string, vscode.SymbolKind> = {tk_name : vscode.SymbolKind.Struct, tk_type : vscode.SymbolKind.TypeParameter, preset : vscode.SymbolKind.Namespace};

        let   type_content  : vscode.SymbolKind | undefined     = undefined;
        let node_hierarchy  : vscode.DocumentSymbol[]           = [];

        function pack_children_simboly(simboly:vscode.DocumentSymbol, ) : void{
          node_hierarchy[node_hierarchy.length-1]["children"].push(simboly);
        }

        function set_place_simboly(simboly:vscode.DocumentSymbol) : void{
          if (node_hierarchy.length == 0){
            symbols.push(simboly);
          }
          // push, as children
          else{
            pack_children_simboly(simboly);
          }

          node_hierarchy.push(simboly);
        }

        for (let i = 0; i < document.lineCount; i++){
          const line            : vscode.TextLine               = document.lineAt(i);
          const text            : string                        = line.text;

          const      var_value  :  RegExpMatchArray             = text.match(/.*[:].*/g)    || [];
          const  open_brackets  :  RegExpMatchArray             = text.match(/[-.<{[]\|/g)  || [];
          const close_brackets  :  RegExpMatchArray             = text.match(/\|[-.>}\]]/g) || [];
          
          if (open_brackets.length > 0){
            const name          : string                        = key_names[open_brackets[0]];
            const node          : vscode.DocumentSymbol         = new vscode.DocumentSymbol(name, open_brackets[0], vscode.SymbolKind.Class, line.range, line.range);
            
            set_place_simboly(node);
            type_content                                        = content_kind[name] || vscode.SymbolKind.Variable;
            
          }

          if (close_brackets.length > 0){
            const self_range    : vscode.Range                  = node_hierarchy[node_hierarchy.length-1].range;
            
            node_hierarchy[node_hierarchy.length-1]["range"]    = new vscode.Range( new vscode.Position(self_range.start.line, self_range.start.line), new vscode.Position(line.range.end.line, line.range.end.character));
            node_hierarchy                                      = node_hierarchy.splice(0,node_hierarchy.length-1);
            
            type_content                                        = undefined;
          }
          
          if (var_value.length > 0 && type_content){
            const var_name                                      = text.slice(0, text.indexOf(":")).trim();
            
            let type_key;
            
            if (var_name in values_exept){
              type_key                                          = values_exept[var_name];
            }
            else{
              type_key                                          = type_content;
            }
            
            const var_node      : vscode.DocumentSymbol         = new vscode.DocumentSymbol(var_name, "", type_key, line.range, line.range);

            pack_children_simboly(var_node);

          }
        }
        
        resolve(symbols);
    });
  }
}