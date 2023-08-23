import * as vscode from 'vscode';
import * as jsonpath from 'jsonpath';
import * as yaml from 'js-yaml';
interface QuickFixOption {
  message: string;
  quickfix: {
    text: string;
    type: string;
  };
  errorCheck: string;
}

interface CustomCodeAction extends vscode.CodeAction {
  [key: string]: any;
}


export function createFix(
  document: vscode.TextDocument,
  range: vscode.Range,
  errorCode: string,
  option: QuickFixOption,
  quickFixes: { [errorCode: string]: QuickFixOption[] }
): vscode.CodeAction | undefined {
  const { message, quickfix } = option;

  const fix: CustomCodeAction = new vscode.CodeAction(
    quickfix.text,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();


  const yamlContent = yaml.load(document.getText());

  if (yamlContent) {
    for (const errorCheck of option.errorCheck.split(',')) {
      const errorPath = errorCheck.trim();
      const matchingNodes = jsonpath.query(yamlContent, errorPath);

      if (matchingNodes.length > 0) {
        for (const node of matchingNodes) {
          
          if (quickfix.type === 'update') {
            
            jsonpath.apply(yamlContent, errorPath, () => quickfix.text);
          }
          
        }
      }
    }

    fix.edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), yaml.dump(yamlContent));
  }

  fix.title = message;

  fix.type = quickfix.type;

  return fix;
}
