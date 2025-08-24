import logo from './logo.svg';
import './App.css';
import React from 'react';
import $ from 'jquery';

function App() {
	const [settings, setSettings] = React.useState({
		noNames: false,
		noTitles: false,
		noObj: false,
		dubSpace: false,
		mdash: false,
		quotes: false,
		ellipses: false,
		qaDots: true,
		qaColons: false,
		qaBlank: false,
		auto: false,
	});
    const [lineCount, setLineCount] = React.useState(1);

    // React.useEffect(() => {
    //     btnApl();
    // }, []);

	$('.settingButton').on('change', function () {
		btnMem();
		if (settings.auto) {
			convert(document.getElementById('textarea'));
		}
	});

	// When window resizes
	$(window).on('resize', function () {
		lines();
	});

	// New way to count the lines by using character length
	const lines = () => {
		// Length of full line is 61 characters
		let q = document.getElementById('textarea');
		let lns = q.value.split('\n');
		let lines = 0;

		let cnt = '';

		for (let i = 0; i < lns.length; i++) {
			// +5 for tabs
			lines = Math.ceil((lns[i].length + 5) / 61);
			console.log(i + ': ', lns[i], ' | ', lines);
			cnt = cnt + (i + 1) + '\n' + '↵\n'.repeat(lines - 1);
		}

        console.log('Total lines: ', lines);

		setLineCount(cnt);
	};

	// Writes button settings to local machine for later retrieval
	const btnMem = () => {
		let inputs = $('.settingButton');
		for (let i = 0; i < inputs.length; i++) {
			localStorage.setItem(inputs[i].id, inputs.eq(i).prop('checked'));
		}
	};

	// Retrieves button settings from local machine
	const btnApl = () => {
		// Retrieve button states from memory
		let inputs = $('.settingButton');

		// Apply button states
		for (let i = 0; i < inputs.length; i++) {
			let btnApply = localStorage.getItem(inputs[i].id);

			if (btnApply == 'true') {
				inputs.eq(i).prop('checked', true);
			} else {
				inputs.eq(i).prop('checked', false);
				if (inputs.eq(i).attr('id') == 'auto') {
					$('#textarea').attr('onkeyup', 'lines()');
				}
			}
		}
	};

	// Clears the textarea and counter
	const btnClr = () => {
		$('#textarea').val('');
		lines();
	};

	// Resets buttons to their original state and resets local storage
	const btnRes = () => {
		let inputs = $('.settingButton');
		for (let i = 0; i < inputs.length; i++) {
			let checked = inputs.eq(i).attr('checked');
			if (checked == 'checked') {
				localStorage.setItem(inputs[i].id, 'true');
			} else {
				localStorage.setItem(inputs[i].id, 'false');
			}
		}
		btnClr();
		btnApl();
	};

	// #########################
	// Does all the converting
	const convert = s => {
		if (s.value != '') {
			// Get rid of weirdness
			s.value = s.value.replace(/·/gm, '');
			//s.value = s.value.replace(/^(?!( *(\d|Q|A|((B[Yy])? *M([Rr]|[Ss]|[Rr][Ss]))|THE))).*$/gm,"");
			s.value = s.value.replace(/^.*@.*$/gm, '');

			// Remove timecodes & line nimbers from beginning of lines
			// Explaination:
			//    looks for beginning of line,
			//    then 0 or more whitespace,
			//    then 0 of more of the format (0 or more numbers then a colon),
			//    then 1 or more numbers,
			//    then 0 or more periods,
			//    then 0 or more whitespace but not newlines
			s.value = s.value.replace(/^\s*(\d{0,2}:)*\d+\.*[^\S\n]*/gm, '');

			// Replace all line breaks with a space
			s.value = s.value.replace(/(\r\n|\n|\r)/gm, ' ');

			// if there's no beginning Q or A, adds one
			if (
				s.value[0] + s.value[1] !== 'Q\t' &&
				s.value[0] + s.value[1] !== 'A\t' &&
				s.value[0] + s.value[1] !== 'Q ' &&
				s.value[0] + s.value[1] !== 'A ' &&
				s.value[0] + s.value[1] !== 'Q.' &&
				s.value[0] + s.value[1] !== 'A.' &&
				s.value[0] + s.value[1] !== 'Q:' &&
				s.value[0] + s.value[1] !== 'A:'
			) {
				if (window.confirm('First line has no Q or A. Is it a Question? (Okay for yes, cancel for no)')) {
					s.value = 'Q. ' + s.value;
				} else {
					if (window.confirm('Is it an answer? (Okay for yes, cancel for no)')) {
						s.value = 'A. ' + s.value;
					}
				}
			}

			// Place returns in front of and tabs after Q's, A's, & names labelling the speech that follows
			if ($('#noNames').is(':checked')) {
				s.value = s.value.replace(/[(Q|A]?[.|:]?\s?( *\(?(B[Yy])? +(M|D)[Ss]?[Rr]?[Ss]?\. +\w+:\W)/gm, '\nQ\t');
			} else {
				s.value = s.value.replace(/[Q|A]?[.|:]?\s?( *\(?(B[Yy])? +(M|D)[Ss]?[Rr]?[Ss]?\. +\w+:\W)/gm, '\nQ\t$1');
			}

			if ($('#noTitles').is(':checked')) {
				s.value = s.value.replace(/[Q|A]?[.|:]?\s(T[Hh][Ee] +W[Ii][Tt][Nn][Ee][Ss]{2} *: *)/gm, '\nA\t');
			} else {
				s.value = s.value.replace(/[Q|A]?[.|:]?\s(T[Hh][Ee] +W[Ii][Tt][Nn][Ee][Ss]{2} *: *)/gm, '\nA\t$1');
			}

			if (settings.qaBlank) {
				s.value = s.value.replace(/(^\s*|\s+)(Q|Q\.|Q:)\s+/gm, '\nQ.\t');
				s.value = s.value.replace(/(^\s*|\s+)(A|A\.|A:)\s+/gm, '\nA.\t');
			} else if (settings.qaColons) {
				s.value = s.value.replace(/(^\s*|\s+)(Q|Q\.|Q:)\s+/gm, '\nQ:\t');
				s.value = s.value.replace(/(^\s*|\s+)(A|A\.|A:)\s+/gm, '\nA:\t');
			} else if (settings.qaBlank) {
				s.value = s.value.replace(/(^\s*|\s+)(Q|Q\.|Q:)\s+/gm, '\nQ\t');
				s.value = s.value.replace(/(^\s*|\s+)(A|A\.|A:)\s+/gm, '\nA\t');
			}

			if (settings.noObj) {
				s.value = s.value.replace(/[Q|A]?[\.|:]?\s?O[Bb][Jj][Ee][Cc][Tt][Ii][Oo][Nn].*$/gm, '');
			}

			//Fix Inconsistent Capitalization
			s.value = s.value.replace(/MS\./gm, 'Ms.');
			s.value = s.value.replace(/MRS\./gm, 'Mrs.');
			s.value = s.value.replace(/MR\./gm, 'Mr.');
			s.value = s.value.replace(/DR\./gm, 'Dr.');
			s.value = s.value.replace(/[Pp][Hh][Dd]\./gm, 'PhD.');

			// Converts Dashes
			if (settings.mdash) {
				s.value = s.value.replace(/ ?-- ?/gm, '—');
			} else {
				s.value = s.value.replace(/–/gm, '-');
				s.value = s.value.replace(/—/gm, ' -- ');
			}

			// Removes double-space after punctuation
			if (settings.dubSpace) {
				s.value = s.value.replace(/([.?!]\1) {2}/gm, '$1 ');
			}

			// Beautifies Quotes
			if (settings.quotes) {
				s.value = s.value.replace(/\s+"(.+?)"/gm, ' “' + '$1' + '”');
				s.value = s.value.replace(/\s+'(.+?)'/gm, ' ‘' + '$1' + '’');
				s.value = s.value.replace(/'/gm, '’');
				s.value = s.value.replace(/\s+'/gm, '‘');
			} else {
				s.value = s.value.replace(/(‘|’)/gm, "'");
				s.value = s.value.replace(/(“|”)/gm, '"');
			}

			// Converts Ellipses
			// Replaces ellipses character with 3 periods
			s.value = s.value.replace(/…/gm, '...');
			if (settings.ellipses) {
				s.value = s.value.replace(/\.{2,} */gm, '. . . ');
			} else {
				s.value = s.value.replace(/(\. *){2,}/gm, '... ');
			}

			// Cleanup
			// Removes spaces at beginning of line & empty lines
			s.value = s.value.replace(/^\s*\n*/gm, '');
			// Removes trailing spaces
			s.value = s.value.replace(/\s+$/gm, '');
			// Removes extra spaces caused by list of line numbers
			s.value = s.value.replace(/(\w)\1 {2,}/gm, '$1 ');
			// Removes extra tabs
			s.value = s.value.replace(/\t+/gm, '\t');
			// Remove duplicate Q/A
			s.value = s.value.replace(/([Q|A].?\s)([Q|A].?\s)/gm, '$1');

			s.select();
			// Copy to clipboard
			navigator.clipboard.writeText(s.value);

			lines();
			btnMem();
		}
	};
	// #########################

	// Scroll textareas together
	$(function () {
		$('#textarea').on('scroll', function () {
			$('#counter').scrollTop($('#textarea').scrollTop());
		});
	});

	return (
		<div id="convertCont">
			<div className="buttons">
				<a className="switchWrap" title="Removes names before speech.&#013;Ex: By Mr. Smith:&#013;(irreversible)">
					<input
						className="propButtons settingButton"
						type="checkbox"
						id="noNames"
						name="noNames"
						value={settings.noNames}
						onChange={() => setSettings({ ...settings, noNames: !settings.noNames })}
					/>
					<label htmlFor="noNames">No Names</label>
				</a>
				<a className="switchWrap" title="Removes Titles.&#013;Ex: THE WITNESS:&#013;(irreversible)">
					<input
						className="propButtons settingButton"
						type="checkbox"
						id="noTitles"
						name="noNames"
						value={settings.noTitles}
						onChange={() => setSettings({ ...settings, noTitles: !settings.noTitles })}
					/>
					<label htmlFor="noTitles">No Titles</label>
				</a>
				<a className="switchWrap" title="Removes Objections (BETA).&#013;Ex: Mr. Lawyer: Objection...&#013;(irreversible)">
					<input
						className="propButtons settingButton betaBtn"
						type="checkbox"
						id="noObj"
						name="noObj"
						value={settings.noObj}
						onChange={() => setSettings({ ...settings, noObj: !settings.noObj })}
					/>
					<label htmlFor="noObj">No Objections</label>
				</a>
				<a className="switchWrap" title=".&#9141;&#9141; becomes .&#9141;&#013;(irreversible)">
					<input
						className="propButtons settingButton"
						type="checkbox"
						id="dubSpace"
						name="dubSpace"
						value={settings.dubSpace}
						onChange={() => setSettings({ ...settings, dubSpace: !settings.dubSpace })}
					/>
					<label htmlFor="dubSpace">No Double Space</label>
				</a>
				<br></br>
				<a className="switchWrap" title="&#9141;--&#9141; becomes &mdash;">
					<input
						className="propButtons settingButton"
						type="checkbox"
						id="mdash"
						name="mdash"
						value={settings.mdash}
						onChange={() => setSettings({ ...settings, mdash: !settings.mdash })}
					/>
					<label htmlFor="mdash">Merged Dashes</label>
				</a>
				<a className="switchWrap" title='quote marks: " &amp; " become &#8220; &amp; &#8221;'>
					<input
						className="propButtons settingButton"
						type="checkbox"
						id="quotes"
						name="quotes"
						value={settings.quotes}
						onChange={() => setSettings({ ...settings, quotes: !settings.quotes })}
					/>
					<label htmlFor="quotes">Smart Quotes</label>
				</a>
				<a className="switchWrap" title="... becomes .&nbsp;.&nbsp;.">
					<input
						className="propButtons settingButton"
						type="checkbox"
						id="ellipses"
						name="quotes"
						value={settings.ellipses}
						onChange={() => setSettings({ ...settings, ellipses: !settings.ellipses })}
					/>
					<label htmlFor="ellipses">Spaced Ellipses</label>
				</a>
				<br></br>
				<a className="switchWrap" title="Changes styling of Qs &amp; As">
					<input
						className="propButtons settingButton"
						type="radio"
						id="qaDots"
						name="qa"
						defaultChecked
						value={settings.qaDots}
						onChange={() => setSettings({ ...settings, qaDots: true, qaColons: false, qaBlank: false })}
					/>
					<label htmlFor="qaDots">Q. | A.</label>
					<input
						className="propButtons settingButton"
						type="radio"
						id="qaColons"
						name="qa"
						value={settings.qaColons}
						onChange={() => setSettings({ ...settings, qaDots: false, qaColons: true, qaBlank: false })}
					/>
					<label htmlFor="qaColons">Q: | A:</label>
					<input
						className="propButtons settingButton"
						type="radio"
						id="qaBlank"
						name="qa"
						value={settings.qaBlank}
						onChange={() => setSettings({ ...settings, qaDots: false, qaColons: false, qaBlank: true })}
					/>
					<label htmlFor="qaBlank">Q&nbsp;&nbsp;| A&nbsp;</label>
					<input
						className="propButtons settingButton"
						type="radio"
						id="qaNone"
						name="qa"
						value={!(settings.qaBlank || settings.qaColons || settings.qaDots)}
						onChange={() => setSettings({ ...settings, qaDots: false, qaColons: false, qaBlank: false })}
					/>
					<label htmlFor="qaNone">None</label>
				</a>
				<br></br>
				<input
					className="propButtons settingButton"
					type="checkbox"
					id="auto"
					name="auto"
					value={settings.auto}
					onChange={() => setSettings({ ...settings, auto: !settings.auto })}
				/>
				<label htmlFor="auto">Auto</label>
				<input type="button" id="go" name="go" onClick={() => convert(document.getElementById('textarea'))} />
				<label htmlFor="go">
					<img src="/rotate-cw.svg" height="16" />
				</label>
				<input type="button" id="clear" onClick={btnClr} />
				<label htmlFor="clear">Clear</label>
				<input type="button" id="resetbtn" onClick={btnRes} />
				<label htmlFor="resetbtn">Reset</label>
				<br></br>
				<small>
					<i>Hover cursor over switches for a description of their function.</i>
				</small>
			</div>
			<div id="txtCont">
				<textarea id="counter" readOnly value={lineCount}></textarea>
				<textarea
					id="textarea"
					style={{ WebkitUserSelect: 'all' }}
					onKeyUp={() => (settings.auto ? convert(document.getElementById('textarea')) : lines())}
					placeholder="Paste the text you copied from your transcript here"></textarea>
			</div>
		</div>
	);
}

export default App;
