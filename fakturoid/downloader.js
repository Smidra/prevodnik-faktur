// Download contents of variable as file
// https://stackoverflow.com/questions/24898044/is-possible-to-save-javascript-variable-as-file
function download_txt() {
    // Figure out the name of output file
    var fileName = "converted.xml"
    try { fileName = document.getElementById('fileInput').files[0].name.split('.xml')[0].concat("-converted.xml") }
    catch { fileName = "converted.xml" }

    var textToSave = document.getElementById('xmlOutput').innerHTML;
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text,' + encodeURI(textToSave);
    hiddenElement.target = '_blank';
    hiddenElement.download = fileName;
    hiddenElement.click();
}

// Suck onto the Download button 
document.getElementById('download-converted').addEventListener('click', download_txt);
