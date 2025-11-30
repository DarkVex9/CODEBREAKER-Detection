var resultsDiv = document.getElementById("results");
var thinkingLabel = document.getElementById("thinking");
var errorLabel = document.getElementById("errorMessage");
var promptField = document.getElementById("promptField");
var strongField = document.getElementById("strongField");
var weakField = document.getElementById("weakField");
var filePromptField = document.getElementById("filePromptField");
var fileUpload = document.getElementById("fileUpload");
var startButton = document.getElementById("startButton");

var rawFile = "";
var rawName = "";

var lastResult;

const cooldownTime = 1000; //Cooldown time in milliseconds
var onCooldown = false; //Helps prevent accidental AI calls

init();

// var testResult = `{
//   "classification": "CLEAN",
//   "explanation": "The code does not exhibit any CODEBREAKER-style adversarial code transformations. It focuses on DOM manipulation, event handling, and API calls for a user interface, with no signs of obfuscation, evasion, or manipulated intent.",
//   "indicators": []
// }`
// createResult("testFile.txt", testResult);

function init(){
	if(isEnvLoaded){
		console.log("Env file loaded");
	}else{
		console.log("Couldn't find 'env.js' file.");
	}

	if(isPromptLoaded){
		console.log("Prompt file loaded");
		initializePromptFields();
	}else{
		console.log("Couldn't find 'prompt.js' file.");
	}

	console.log("Javascript Initialized");
	
	fileUpload.addEventListener('change', processFile, false);

	startButton.addEventListener("click", scan, false);
}


function initializePromptFields(){
	promptField.value = mainPrompt;
	strongField.value = strongSigns;
	weakField.value = weakSigns;
	filePromptField.value = filePrompt;
}

function processFile(event) {
	//File upload loosely based on this Stack Overflow answer https://stackoverflow.com/a/39515846
    console.info("File uploaded");
	let fileList = event.target.files;
	let file = fileList[0];
	let reader = new FileReader();

    let displayFile = (e) => { // set the contents of the <textarea>
        console.info( 'File Uploaded:', e.target.result.length, e);
        document.getElementById('fileUpload').innerHTML = e.target.result;
		rawFile = e.target.result;
        };

    let onReaderLoad = (fl) => {
        console.info('file reader load', fl);
		rawName = fl.name;
        return displayFile;
        };

    // Closure to capture the file information.
    reader.onload = onReaderLoad( file );

    // Read the file as text.
    reader.readAsText( file );
}

async function scan(){
	if(onCooldown){
		return;
	}
	errorLabel.style.display = "none";
	let errorText = "";
	if(!isEnvLoaded){
		errorText += "Scan aborted due to missing environment variable file ('env.js')\n";
	}
	if(rawFile.length < 6){
		errorText += "Scan aborted due to missing or empty code file.\n";
	}
	if(promptField.value.length < 6){
		errorText += "Scan aborted due to missing main prompt.\n";
	}
	if(errorText.length > 0){
		errorLabel.style.display = "block";
		errorLabel.textContent = "Error!\n"+errorText;
		return;
	}
	onCooldown = true;
	setTimeout(()=>{onCooldown = false}, cooldownTime);
	thinkingLabel.style.display = "block";
	console.log("Sending query");
	let result = await ai_call(promptField.value + "\n" + strongField.value + "\n" + weakField.value + "\n" + filePromptField.value + rawFile);
	thinkingLabel.style.display = "none";
	try{result;}
	catch(e){
		console.log("No result returned");
		return;
	}
	console.log("Result recieved.");
	console.log(result);
	for(let candidateIndex = 0; candidateIndex < result.candidates.length; candidateIndex++){
		for(let partIndex = 0; partIndex < result.candidates[candidateIndex].content.parts.length; partIndex++){
			console.log(result.candidates[candidateIndex].content.parts[partIndex].text);
			createResult(rawName, result.candidates[candidateIndex].content.parts[partIndex].text);
		}
	}
	lastResult = result;
}

async function ai_call(prompt){
	let callBody = {
		contents:[
			{
				role:"user",
				parts:[{text:prompt}]
			}
		],
		generationConfig:{
			temperature: 0.8,
			responseMimeType: "application/json",
			responseSchema: {
				type: "OBJECT",
				properties: {
					classification: {
						type: "STRING",
						format: "ENUM",
						enum: ["LIKELY COMPROMISED","SUSPICIOUS","CLEAN"]
					},
					indicators: {
						type: "ARRAY",
						items: {
							type: "STRING"
						}
					},
					explanation: {
						type: "STRING"
					}
				},
				required: ["classification"]
			}
		}
	}
	console.log("Call Body:",callBody);
	try {
		const response = await fetch(VERTEX_API_ADDRESS+":generateContent?key="+VERTEX_API_KEY, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(callBody)
		});
    	if (!response.ok) {
			console.log("Fetch error of '"+response.status+"'")
    		throw new Error(`Response status: ${response.status}`);
    	}

    	const result = await response.json();
    	console.log("AI Call Result:",result);
		return result;
  	} catch (error) {
    	console.error(error.message);
  	}
}

function clearResults(){
	resultsDiv.innerHTML = "";
}

function createResult(fileName, resultString){
	console.log("Printing result for "+fileName);
	let result = JSON.parse(resultString);

	let div = document.createElement("div");
	div.className = "box";

	let header = document.createElement("h3");
	header.appendChild(document.createTextNode(fileName+" - "+result.classification));
	switch(result.classification){
		case "CLEAN":
			header.style.color = "#008800";
			break;
		case "SUSPICIOUS":
			header.style.color = "#cc8800";
			break;
		case "LIKELY COMPROMISED":
			header.style.color = "#dd0000";
			break;
	}
	div.appendChild(header);

	let explanationlabel = document.createElement("p");
	let boldLabel = document.createElement("b");
	explanationlabel.appendChild(boldLabel);
	boldLabel.appendChild(document.createTextNode("Explanation:"));
	div.appendChild(explanationlabel);

	let explanation = document.createElement("p");
	explanation.appendChild(document.createTextNode(result.explanation));
	div.appendChild(explanation);

	if(result.indicators.length > 0){
		let indicatorLabel = document.createElement("p");
		let boldLabel = document.createElement("b");
		indicatorLabel.appendChild(boldLabel);
		boldLabel.appendChild(document.createTextNode("Indicators:"));
		div.appendChild(indicatorLabel);

		for(let i = 0; i < result.indicators.length; i++){
			let indicatorBox = document.createElement("div");
			indicatorBox.className = "subBlock";
			let indicatorText = document.createElement("p");
			indicatorText.appendChild(document.createTextNode(result.indicators[i]));
			indicatorBox.appendChild(indicatorText);
			div.appendChild(indicatorBox);
		}
	}else{
		let indicatorLabel = document.createElement("p");
		let boldLabel = document.createElement("b");
		indicatorLabel.appendChild(boldLabel);
		boldLabel.appendChild(document.createTextNode("No indicators returned."));
		div.appendChild(indicatorLabel);
	}
	resultsDiv.appendChild(div);
}
