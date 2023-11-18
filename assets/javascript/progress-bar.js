// Allow simple controlling of the progress bar indicator
class progressBar {
    // Constructor to load elements from HTML by ID
    constructor() {
        this.progressUpload = document.getElementById("progress-upload");
        this.progressImport = document.getElementById("progress-import");
        this.progressTransform = document.getElementById("progress-transform");
        this.progressExport = document.getElementById("progress-export");
        this.progressDone = document.getElementById("progress-done");
    }

    // Method to set the state parameter on the progressUpload element
    setProgressUpload(value) {
        this.progressUpload.setAttribute("state", value);
    }

    // Method to set the state parameter on the progressImport element
    setProgressImport(value) {
        this.progressImport.setAttribute("state", value);
    }

    // Method to set the state parameter on the progressTransform element
    setProgressTransform(value) {
        this.progressTransform.setAttribute("state", value);
    }

    // Method to set the state parameter on the progressExport element
    setProgressExport(value) {
        this.progressExport.setAttribute("state", value);
    }

    // Method to set the state parameter on the progressDone element
    setProgressDone(value) {
        this.progressDone.setAttribute("state", value);
        var downloadButton = document.getElementById("download-converted");
        downloadButton.disabled = false
    }
}
