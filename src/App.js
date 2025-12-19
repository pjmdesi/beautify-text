import logo from './bt-icon.svg';
import './App.scss';
import examplePDF from './example-transcript.pdf';
import React from 'react';
import $ from 'jquery';
import * as Icon from 'react-bootstrap-icons';

function App() {
	const defaultSettings = {
		newNewLines: false,
		noNames: false,
		noTitles: false,
		noObj: false,
		dubSpace: false,
		mdash: false,
		quotes: false,
		ellipses: false,
		qaActive: false,
		qaRadio: 'qaDots',
		auto: false,
	};

	const qaTypes = {
		qaDots: '.',
		qaColons: ':',
		qaBlank: '\u00A0',
		qaDash: '\u00A0-',
	};

	const [settings, setSettings] = React.useState(localStorage.getItem('buttonSettings') ? JSON.parse(localStorage.getItem('buttonSettings')) : defaultSettings);
	const [textAreaValue, setTextAreaValue] = React.useState(localStorage.getItem('textAreaValue') ? JSON.parse(localStorage.getItem('textAreaValue')) : '');

	const [lineCount, setLineCount] = React.useState(1);

	const textAreaRef = React.useRef(null);
	const infoDialog = React.useRef(null);
	const qaActiveInput = React.useRef(null);

	const qaRefs = React.useRef({});
	React.useEffect(() => {
		Object.keys(qaTypes).forEach(key => {
			qaRefs.current[`${key}Input`] = React.createRef();
		});
	}, []);

	// Calculates & displays line numbers next to textarea
	// If line wraps due to the width of the textarea, counts those as well by showing a ↵ symbol
	const configureLines = () => {
		let textArea = textAreaRef.current;
		let textAreaWidth = $(textArea).width();
		let properLines = textArea.value.split('\n');
		let visualLines = 0;

		let lineCountStr = '';

		for (let line of properLines) {
			// Count characters in line
			let lineCharacterCount = line.length || 1;
			// For every tab in line, add 4 to length count
			let tabCount = (line.match(/\t/g) || []).length;
			lineCharacterCount += tabCount * 6;

			let charWidth = 8.8;
			let lineCharacterWidth = Math.floor(lineCharacterCount * charWidth);

			// Calculate how many visual lines this line takes up
			let lineWraps = lineCharacterWidth / textAreaWidth;

			lineWraps = Math.ceil(lineWraps);

			visualLines += lineWraps;
			// Add to counter string
			lineCountStr = lineCountStr + (visualLines - lineWraps + 1) + '\n' + '↵\n'.repeat(lineWraps - 1);
		}

		setLineCount(lineCountStr);
	};

	const saveTextareaValue = (value = textAreaValue) => {
		let textAreaValueForSave = value;
		localStorage.setItem('textAreaValue', JSON.stringify(textAreaValueForSave));
	};

	// Writes button settings to local machine for later retrieval
	const saveButtonSettings = (buttonSettings = settings) => {
		localStorage.setItem('buttonSettings', JSON.stringify(buttonSettings));
	};

	const convert = (taVal = textAreaValue) => {
		if (taVal !== '') {
			let qaSymbol = qaTypes[settings.qaRadio];

			let qaSymbolsMap = Array.from(Object.values(qaTypes)).join('|');

			let qaDetectionMap = `(Q|A)(${qaSymbolsMap})?`;

			// Get rid of weirdness
			taVal = taVal.replace(/·/gm, '');
			taVal = taVal.replace(/^.*@.*$/gm, '');

			// Remove timecodes & line nimbers from beginning of lines
			// Explaination:
			//    looks for beginning of line,
			//    then 0 or more whitespace,
			//    then 0 of more of the format (0 or more numbers then a colon),
			//    then 1 or more numbers,
			//    then 0 or more periods,
			//    then 0 or more whitespace but not newlines
			taVal = taVal.replace(/^\s*(\d{0,2}:)*\d+\.*[^\S\n]*/gm, '');

			// Place returns in front of and tabs after Q's, A's, & names labelling the speech that follows
			let namesRegex = new RegExp(`[Q|A]?[${qaSymbolsMap}]?[.|:]?\\s?( *\\(?(B[Yy])? +(M|D)[Ss]?[Rr]?[Ss]?\\. +\\w+:\\W)`, 'gm');
			if (settings.noNames) {
				taVal = taVal.replace(namesRegex, '\nQ\t');
			} else {
				taVal = taVal.replace(namesRegex, '\nQ\t$1');
			}

			let titlesRegex = new RegExp(`[Q|A]?[${qaSymbolsMap}]?[.|:]?\\s?( *T[Hh][Ee] +W[Ii][Tt][Nn][Ee][Ss]{2} *: *)`, 'gm');
			if (settings.noTitles) {
				taVal = taVal.replace(titlesRegex, '\nA\t');
			} else {
				taVal = taVal.replace(titlesRegex, '\nA\t$1');
			}

			// Manage Q&A formatting
			let qaRegex = new RegExp(`(^\\s*|\\s+)${qaDetectionMap}\\s+`, 'gm');
			if (settings.qaActive) {
				// Check if first line has Q or A
				let firstLineRegex = new RegExp(`^\\s*${qaDetectionMap}\\s+`, 'm');
				let detectedQA = !!taVal.match(firstLineRegex);

				// if there's no beginning Q or A, adds one
				if (!detectedQA) {
					console.log('no QA');

					let firstLineType = 'Q';

					if (window.confirm('First line has no Q or A. Is it a Question? (Okay for yes, cancel for no)')) {
						firstLineType = 'Q';
					} else {
						if (window.confirm('Is it an answer? (Okay for yes, cancel for no)')) {
							firstLineType = 'A';
							taVal = `${firstLineType + qaSymbol}\t` + taVal;
						}
					}
					taVal = `${firstLineType + qaSymbol}\t` + taVal;

					// Add Qs or As to the beginning of new lines depending on user choice
					let qaArray = firstLineType === 'Q' ? ['Q', 'A'] : ['A', 'Q'];

					let qaIndex = 0;

					const newlineReplace = () => {
						qaIndex = (qaIndex + 1) % 2;
						return `\n${qaArray[qaIndex] + qaSymbol}\t`;
					};

					taVal = taVal.replace(/(\r\n|\n|\r)/gm, newlineReplace);
				} else {
					taVal = taVal.replace(qaRegex, `\n$1$2${qaSymbol}\t`);
				}
			} else {
				taVal = taVal.replace(qaRegex, '\n$1$2 \t');
			}

			let objectionRegex = new RegExp(`${qaDetectionMap}\\s?O[Bb][Jj][Ee][Cc][Tt][Ii][Oo][Nn].*$`, 'gm');
			if (settings.noObj) {
				taVal = taVal.replace(objectionRegex, '');
			}

			//Fix Inconsistent Capitalization
			taVal = taVal.replace(/MS\./gm, 'Ms.');
			taVal = taVal.replace(/MRS\./gm, 'Mrs.');
			taVal = taVal.replace(/MR\./gm, 'Mr.');
			taVal = taVal.replace(/DR\./gm, 'Dr.');
			taVal = taVal.replace(/[Pp][Hh][Dd]\./gm, 'PhD.');

			// Converts Dashes
			if (settings.mdash) {
				taVal = taVal.replace(/ ?-- ?/gm, '—');
			} else {
				taVal = taVal.replace(/–/gm, '-');
				taVal = taVal.replace(/—/gm, ' -- ');
			}

			// Removes double-space after punctuation
			if (settings.dubSpace) {
				taVal = taVal.replace(/([.?!;'"\w]) {2,}/gm, '$1 ');
			}

			// Beautifies Quotes
			if (settings.quotes) {
				taVal = taVal.replace(/(\s+)"(.+?)"/gm, '$1“$2”');
				taVal = taVal.replace(/(\s+)'(.+?)'/gm, '$1‘$2’');
				taVal = taVal.replace(/'/gm, '’');
				taVal = taVal.replace(/(\s+)'/gm, '$1‘');
			} else {
				taVal = taVal.replace(/(‘|’)/gm, "'");
				taVal = taVal.replace(/(“|”)/gm, '"');
			}

			// Converts Ellipses
			// Replaces ellipses character with 3 periods
			taVal = taVal.replace(/…/gm, '...');
			if (settings.ellipses) {
				taVal = taVal.replace(/\.{2,} */gm, '. . . ');
			} else {
				taVal = taVal.replace(/(\. *){2,}/gm, '... ');
			}

			// Cleanup
			// Removes spaces at beginning of line & empty lines
			taVal = taVal.replace(/^\s*\n*/gm, '');
			// Removes trailing spaces
			taVal = taVal.replace(/\s+$/gm, '');
			// Removes extra spaces caused by list of line numbers
			taVal = taVal.replace(/(\w)\1 {2,}/gm, '$1 ');
			// Removes extra tabs
			taVal = taVal.replace(/\t+/gm, '\t');
			// Remove duplicate Q/A
			taVal = taVal.replace(/([Q|A].?\s)([Q|A].?\s)/gm, '$1');

			// Removes all new lines if setting is on
			if (settings.newNewLines) {
				taVal = taVal.replace(/(\r\n|\n|\r)/gm, ' ');
			}

			textAreaRef.current.select();
			document.execCommand('copy');

			setTextAreaValue(taVal);
		}
	};

	const removeQA = () => {
		// Show alert to user since this is irreversible
		if (!window.confirm('Are you sure you want to remove all Q&A labels? This action cannot be undone.')) {
			return;
		}

		let qaSymbolsMap = Array.from(Object.values(qaTypes)).join('|');

		let qaDetectionMap = `(Q|A)(${qaSymbolsMap})?`;

		let taVal = textAreaValue;
		let qaRegex = new RegExp(`(^\\s*|\\s+)${qaDetectionMap}\\s+`, 'gm');

		taVal = taVal.replace(qaRegex, '\n');
		taVal = taVal.replace(/\n+/, '');
		textAreaRef.current.select();
		setTextAreaValue(taVal);

		document.execCommand('copy');
		saveTextareaValue(taVal);
	};

	React.useEffect(() => {
		// When window resizes
		let win = $(window);
		win.on('resize', function () {
			configureLines();
		});

		// Scroll textareas together
		let textAreaElem = $(textAreaRef.current);
		textAreaElem.on('scroll', function () {
			$('#counter').scrollTop(textAreaElem.scrollTop());
		});

		return () => {
			win.off('resize');
			textAreaElem.off('scroll');
		};
	});

	// Whenever settings change, apply them to buttons
	React.useEffect(() => {
		// applyButtonSettings(settings);
		saveButtonSettings(settings);
		if (settings.auto) {
			convert(textAreaRef.current);
		}
	}, [settings]);

	// Whenever text area value changes, reconfigure line numbers
	React.useEffect(() => {
		// Copy to clipboard
		saveTextareaValue(textAreaValue);
		configureLines();
	}, [textAreaValue]);

	const showInfo = () => {
		infoDialog.current.showModal();
	};

	return (
		<div id="convertCont">
			<div id="header">
				<div>
					<h1>Beautify Text</h1>
					<h2>Convert your transcript text into a more friendly format.</h2>
				</div>
				<div id="info">
					<Icon.InfoCircle size={24} color="#00f" onClick={showInfo} />
					<img src={logo} height="48" alt="Beautify Text Logo" />
				</div>
			</div>
			<hr></hr>
			<small>
				<i>Hover cursor over switches for a description of their function.</i>
			</small>
			<div className="switch-container">
				<div className="switchWrap" title="Removes all New Lines (irreversible)">
					<input
						type="checkbox"
						id="newNewLines"
						name="newNewLines"
						value={settings.newNewLines}
						onChange={() => setSettings({ ...settings, newNewLines: !settings.newNewLines })}
						checked={settings.newNewLines}
					/>
					<label htmlFor="newNewLines">No New Lines</label>
				</div>
				<div className="switchWrap" title="Removes names before speech.&#013;Ex: By Mr. Smith:&#013;(irreversible)">
					<input
						type="checkbox"
						id="noNames"
						name="noNames"
						value={settings.noNames}
						onChange={() => setSettings({ ...settings, noNames: !settings.noNames })}
						checked={settings.noNames}
					/>
					<label htmlFor="noNames">No Names</label>
				</div>
				<div className="switchWrap" title="Removes Titles.&#013;Ex: THE WITNESS:&#013;(irreversible)">
					<input
						type="checkbox"
						id="noTitles"
						name="noNames"
						value={settings.noTitles}
						onChange={() => setSettings({ ...settings, noTitles: !settings.noTitles })}
						checked={settings.noTitles}
					/>
					<label htmlFor="noTitles">No Titles</label>
				</div>
				<div className="switchWrap" title="Removes Objections (BETA).&#013;Ex: Mr. Lawyer: Objection...&#013;(irreversible)">
					<input
						className="propButtons settingButton betaBtn"
						type="checkbox"
						id="noObj"
						name="noObj"
						value={settings.noObj}
						onChange={() => setSettings({ ...settings, noObj: !settings.noObj })}
						checked={settings.noObj}
					/>
					<label htmlFor="noObj">No Objections</label>
				</div>
				<div className="switchWrap" title=".&#9141;&#9141; becomes .&#9141;&#013;(irreversible)">
					<input
						type="checkbox"
						id="dubSpace"
						name="dubSpace"
						value={settings.dubSpace}
						onChange={() => setSettings({ ...settings, dubSpace: !settings.dubSpace })}
						checked={settings.dubSpace}
					/>
					<label htmlFor="dubSpace">No Double Space</label>
				</div>
			</div>
			<div className="switch-container">
				<div className="switchWrap" title=" -- becomes &mdash;">
					<input
						type="checkbox"
						id="mdash"
						name="mdash"
						value={settings.mdash}
						onChange={() => setSettings({ ...settings, mdash: !settings.mdash })}
						checked={settings.mdash}
					/>
					<label htmlFor="mdash">Merged Dashes</label>
				</div>
				<div className="switchWrap" title='quote marks: " &amp; " become &#8220; &amp; &#8221;'>
					<input
						type="checkbox"
						id="quotes"
						name="quotes"
						value={settings.quotes}
						onChange={() => setSettings({ ...settings, quotes: !settings.quotes })}
						checked={settings.quotes}
					/>
					<label htmlFor="quotes">Smart Quotes</label>
				</div>
				<div className="switchWrap" title="... becomes .&nbsp;.&nbsp;.">
					<input
						type="checkbox"
						id="ellipses"
						name="quotes"
						value={settings.ellipses}
						onChange={() => setSettings({ ...settings, ellipses: !settings.ellipses })}
						checked={settings.ellipses}
					/>
					<label htmlFor="ellipses">Spaced Ellipses</label>
				</div>
			</div>
			<div className="switch-container">
				<div className="switchWrap" title="Manage Q&amp;A styling">
					<input
						ref={qaActiveInput}
						type="checkbox"
						id="qaActive"
						name="qaActive"
						value={settings.qaActive}
						onChange={() => setSettings({ ...settings, qaActive: !settings.qaActive })}
						checked={settings.qaActive}
					/>
					<label htmlFor="qaActive">Manage Qs/As</label>
				</div>
				<div className="switchWrap" title="Changes styling of Qs &amp; As">
					{Object.keys(qaTypes).map(key => (
						<React.Fragment key={key}>
							<input
								ref={qaRefs.current[`${key}Input`]}
								type="radio"
								id={key}
								name="qaRadio"
								value={key}
								onChange={() => setSettings({ ...settings, qaRadio: key })}
								checked={settings.qaActive && settings.qaRadio === key}
								disabled={!settings.qaActive}
							/>
							<label htmlFor={key}>
								Q{qaTypes[key]}/A{qaTypes[key]}
							</label>
						</React.Fragment>
					))}
				</div>
				<div className="buttonWrap">
					<input type="button" id="qaRemove" onClick={removeQA} />
					<label
						htmlFor="qaRemove"
						style={{
							background: '#f88',
							border: '2px solid #e99',
						}}>
						Remove Qs/As
					</label>
				</div>
			</div>
			<div className="switch-container">
				<div className="switchWrap">
					<input
						type="checkbox"
						id="auto"
						name="auto"
						value={settings.auto}
						onChange={() => setSettings({ ...settings, auto: !settings.auto })}
						title="Automatically applies changes as you paste"
					/>
					<label htmlFor="auto">
						Auto Apply <Icon.GearWideConnected />
					</label>
				</div>
				<div className="buttonWrap">
					<input type="button" id="go" name="go" onClick={() => convert(textAreaValue)} disabled={settings.auto} />
					<label htmlFor="go">
						Apply Formatting <Icon.Fonts size={21} />
					</label>
				</div>
				<div className="buttonWrap">
					<input type="button" id="clear" onClick={() => setTextAreaValue('')} />
					<label htmlFor="clear">
						Clear Text <Icon.Trash />
					</label>
				</div>
				<div className="buttonWrap">
					<input type="button" id="resetbtn" onClick={() => setSettings(defaultSettings)} />
					<label htmlFor="resetbtn">
						Reset Settings <Icon.ArrowCounterclockwise />
					</label>
				</div>
			</div>
			<div id="txtCont" className={settings.auto ? 'autoOn' : 'autoOff'}>
				<textarea id="counter" readOnly value={lineCount}></textarea>
				<textarea
					id="textarea"
					ref={textAreaRef}
					style={{ WebkitUserSelect: 'all' }}
					onKeyUp={() => (settings.auto ? convert(textAreaRef.current) : configureLines())}
					onChange={e => setTextAreaValue(e.target.value)}
					value={textAreaValue}
					placeholder="Paste the text you copied from your transcript here"></textarea>
			</div>
			<small>
				<i>Formatted text is automatically copied to your clipboard.</i>
			</small>
			<hr></hr>
			<div id="footer">
				<p>
					This tool does not guarantee results and is provided "as is" without warranty of any kind. If you have any issues or requests,{' '}
					<a href="https://pjm.design/contact" target="_blank" rel="noopener noreferrer">
						please send me a message
					</a>
					.
				</p>
				<p>
					This project is open source and free to use for any purpose. Built using React. Your data is stored on your local machine and is never transmitted to any
					server.
				</p>
				<p>
					<a href={examplePDF} target="_blank" rel="noopener noreferrer">
						View example transcript file
					</a>
				</p>
				<p>
					Created by{' '}
					<a href="https://pjm.design" target="_blank" rel="noopener noreferrer">
						pjm.design
					</a>
				</p>
				<p>
					<a href="https://github.com/pjmdesi/beautify-text" target="_blank" rel="noopener noreferrer">
						View on GitHub
					</a>
				</p>
			</div>
			<dialog id="infoDialog" ref={infoDialog}>
				<div id="infoDialogContent">
					<h2>About Beautify Text</h2>
					<p>
						This is a free tool designed to help format transcript text into a more friendly format. It is especially useful for legal transcripts, interviews, and
						other Q&A style documents.
					</p>
					<p>
						OCR documents typically contain various artifacts such as line numbers, rogue spacing, timecodes, and inconsistent formatting that can make them difficult
						to work with when their content is copied and pasted into other applications.
					</p>
					<p>
						Simply paste your transcript text into the provided text area, select your desired formatting options, and click "Apply Formatting" to see the changes. The
						formatted text is automatically copied to your clipboard for easy pasting elsewhere.
					</p>
					<p>
						<small>
							This project was originally designed during my tenure at a legal consulting firm which provided lawyers with graphically enhanced presentations,
							animations, and other visual aids to support their cases.
						</small>
					</p>
					<input id="closeInfoDialog" type="button" onClick={() => document.getElementById('infoDialog').close()} />
					<label htmlFor="closeInfoDialog">Close</label>
				</div>
			</dialog>
		</div>
	);
}

export default App;
