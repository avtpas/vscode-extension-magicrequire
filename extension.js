// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const readjson = require('readjson');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function getJSONFile(filename) {
  const folder = vscode.workspace.rootPath;
  try {
    // eslint-disable-next-line
    const pkg = readjson.sync(path.join(folder, filename));
    return pkg;
  } catch (e) {
    console.warn(`Unable to find ${filename}`);
  }
  return null;
}


function getFileName(filepath) {
	return path.parse(filepath).base;
}

function loadInstalledModules() {
  const folder = vscode.workspace.rootPath;
  const pkg = getJSONFile('package.json');
  const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
  const dev = pkg.devDependencies ? Object.keys(pkg.devDependencies) : [];
  const allDeps = deps.concat(dev);
  return allDeps.map((d) => {
    const depFolderPath = path.join(folder, 'node_modules', d);
    let fsPath = null;
    try {
      fsPath = require.resolve(depFolderPath);
    } catch (e) {
      // console.log(e);
    }
    return {
			label: d,
			// description: d,
      fsPath,
      isAbsolute: true,
    };
  }).filter(d => d.fsPath);
}

function getContextConfiguration() {
	return getJSONFile('magicrequire.json')
}

function start(type) {
	const config = getContextConfiguration();
	if (!config) {
		vscode.window.showErrorMessage('file magicrequire.json is required, make one first');
		return;
	}
	const INCLUDE_PATTERN = `**/*.{${config.include.toString()}}`;
	const EXCLUDE_PATTERN = `**/{${config.exclude.toString()}}`;
	const installedModules = loadInstalledModules();
	vscode.workspace.findFiles(INCLUDE_PATTERN, EXCLUDE_PATTERN, 0).then((uriResults) => {

		const { activeTextEditor } = vscode.window;
		if (!activeTextEditor) {
			return;
		}

		const { fileName: editorFileName } = activeTextEditor.document;
		const items = uriResults.reduce((arr, uri) => {
			if (editorFileName !== uri.fsPath) {
				const relativePath = vscode.workspace.asRelativePath(uri.fsPath)
				// const filename = getFileName(relativePath);
				arr.push({
					label: relativePath,
					// description: relativePath,
					fsPath: uri.fsPath,
				});
			}
			return arr;
		}, []).concat(installedModules);

		vscode.window.showQuickPick(items, {
			placeHolder: 'select file',
		}).then((value) => {
			if (!value) {
				return;
			}
			const parse = path.parse(value.fsPath);
			const skipFileName = parse.name === 'index';

			const { alias = {} } = config;
			let importer = {};
			if (!value.isAbsolute) {
				importer = Object.keys(alias).reduce((ps, a) => {
					if (ps.done) return ps;
					
					const key = alias[a];
					let formedRelativePath = '';
					if (!value.isAbsolute) {
						formedRelativePath = `./${path.relative(vscode.workspace.rootPath, ps.label)}`;
					} else {
						formedRelativePath = ps.label;
					}
					
					if (formedRelativePath.startsWith(key)) {
						const tempArray = formedRelativePath.split('');
						tempArray.splice(0, key.length, a.split(''));
						formedRelativePath = tempArray.join('');
						return {
							done: true,
							label: formedRelativePath,
						}
					}
					return ps;
				}, { label: skipFileName ? value.label.replace(parse.base, '')
					: value.label.replace(parse.ext, ''), done: false });

			} else {
				importer = {
					label: value.label,
					done: true,
				}
			}
			

			if (!importer.done) {
				importer.label = path.relative(activeTextEditor.document.fileName, value.fsPath);
			}
			activeTextEditor.edit((edit) => {
				// 这里最好可以自动创建新行、自动寻找最佳插入位置
				let position = activeTextEditor.selection.active;
				let moduleName = (() => {
					if (skipFileName) {
						const arr = parse.dir.split('/');
						return arr.slice(arr.length - 1, arr.length);
					}
					return parse.name;
				})()
				if (value.isAbsolute) {
					moduleName = value.label;
				}

				if (!/^[A-Za-z]+$/.test(moduleName)) {
					moduleName = 'Module';
				}
				let script = '';
				if (type === 'require') {
				script = `const ${moduleName} = require('${importer.label}');\r\n`;
				} else {
					script = `import ${moduleName} from '${importer.label}';\r\n`;
				}

				if (position.character > 0) {
					position = position.with({ character: 0, line: position.line + 1 });
				}

				edit.insert(position, script);
			});
		});
	})
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "magic-require" is now active!');

	let disposable = vscode.commands.registerCommand('extension.magicRequire', function () {
		// The code you place here will be executed every time your command is executed
		const { activeTextEditor } = vscode.window;
		if (!activeTextEditor) {
			vscode.window.showInformationMessage('please select an file first 😢');
			return;
		}

		vscode.window.showQuickPick([{
			label: 'use import',
			mode: 'import',
			description: 'import Module form \'./path/Module\';'
		}, {
			label: 'use require',
			mode: 'require',
			description: 'const Module = require(\'./path/Module\');'
		}], {
			placeHolder: 'select mode'
		}).then(({ mode }) => {
			start(mode);
		})
	});

	context.subscriptions.push(disposable);

	
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
