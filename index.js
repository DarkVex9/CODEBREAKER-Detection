var resultsDiv = document.getElementById("results");

init();


function init(){
  let sampleCode = "line 1\nline 2\n\nline4";
  let sampleSource = "placeholder.js line 1";
  resultsDiv.appendChild(createCodeSnippet(sampleCode,sampleSource));
  console.log("Javascript Initialized");
}

function createCodeSnippet(code, labelText){
    let div = document.createElement("div");
    div.className = "box";
    
    let label = document.createElement("p");
    label.appendChild(document.createTextNode(labelText));
    div.appendChild(label);
    
    div.appendChild(document.createElement("br"));
    
    let codeBlock = document.createElement("div");
    codeBlock.className = "codeBlock";
    var splitCode = code.split("\n");
    for (let i = 0; i < splitCode.length; i++){
      let paragraph = document.createElement("p");
      paragraph.appendChild(document.createTextNode(splitCode[i]));
      codeBlock.appendChild(paragraph);
    }
    div.appendChild(codeBlock);
    return div;
}