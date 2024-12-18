// Convert JSON value into array if its not an array already
function ensureArrayFor(jsonIn) {
    // Check if jsonIn is an array
    if (Array.isArray(jsonIn)) {
        return jsonIn // It is an array, so it gets returned.
    } else {
        // It was not an array, so we make it an array
        var jsonInAsArray = [];
        jsonInAsArray[0] = jsonIn
        return jsonInAsArray
    }
}

// Convert a JSON file with multiple Fakturoid Invoices
function convertWholeFile(jsonIn) {
    // Define wrapper of the whole file
    var jsonOut = {}
    //jsonOut.DocumentPack = jsonIn.invoices.invoice.number;
    jsonOut.DocumentPack = {};
    jsonOut.DocumentPack.DOCUMENTS = {};
    jsonOut.DocumentPack.DOCUMENTS.Document = [];

    // Convert each invoice in the input
    var invoiceNr = 0
    var inputInvoicesArray = ensureArrayFor(jsonIn.fakturkaMultiple.FAKTURA)
    //console.log("Finished ensuring array")
    //console.log(inputInvoicesArray)
    inputInvoicesArray.forEach(FAKTURA => {
        jsonOut.DocumentPack.DOCUMENTS.Document[invoiceNr] = convertInvoice(FAKTURA)
        invoiceNr += 1
    });

    // Return the finished converted file
    console.log("Json OUT:")
    console.log(jsonOut)
    return jsonOut
}

// Transfer date from 31.12.2023 to 2023-12-31:T00:00:00.00
function transferDate(oldDate) {
    var a = oldDate.split(".")[0]
    var b = oldDate.split(".")[1]
    var c = oldDate.split(".")[2]
    var newDate = c.concat("-").concat(b).concat("-").concat(a).concat("T00:00:00.00")
    return newDate
}

function transferDateSimple(oldDate) {
    var a = oldDate.split(".")[0]
    var b = oldDate.split(".")[1]
    var c = oldDate.split(".")[2]
    var newDate = c.concat("-").concat(b).concat("-").concat(a)
    return newDate
}


// Script to convert Fakturka invoice in JSON >> Kastner Invoice in JSON
function convertInvoice(invoice) {
    //console.log(invoice)
    FIXED = 2 // Rounding precision for calculations
    var document = {}
    // Document header - DONE
    document.DocumentHeader = {};
    document.DocumentHeader.DocumentID = invoice.ZAHLAVI.EVIDENCNI_CISLO;
    document.DocumentHeader.TypeOfDocument = "Invoice"
    document.DocumentHeader.DocumentCaption = "FAKTURA - daňový doklad"
    // Document Buyer - DONE
    document.Buyer = {};
    document.Buyer.Address = {};
    document.Buyer.Address.Street = invoice.ODBERATEL_ZAKAZNIK.O_ADRESA.O_ULICE;
    document.Buyer.Address.City = invoice.ODBERATEL_ZAKAZNIK.O_ADRESA.O_OBEC;
    document.Buyer.Address.PostalCode = invoice.ODBERATEL_ZAKAZNIK.O_ADRESA.O_PSC;
    document.Buyer.Company = {};
    document.Buyer.Company.Company = invoice.ODBERATEL_ZAKAZNIK.O_OBCHODNI_NAZEV_FIRMY;
    document.Buyer.Company.CompanyRegistrationNo = invoice.ODBERATEL_ZAKAZNIK.O_IC;
    document.Buyer.Company.CompanyTaxRegistrationNo = invoice.ODBERATEL_ZAKAZNIK.O_DIC;
    document.Buyer.Company.VATPayer = {}
    var custom_code = invoice.ODBERATEL_ZAKAZNIK.O_OBCHODNI_NAZEV_FIRMY.split(" ")[0].toLowerCase().substring(0, 10); // tohle kod firmy v mém programu, jde-li to tak tak malými písmeny první slovo, max. 10 znaků
    document.Buyer.Company.CompanyCode = custom_code;
    // Document Issue - Drobnosti
    document.Issue = {};
    document.Issue.IssueDate = transferDate(invoice.ZAHLAVI.DATUM_VYSTAVENI);
    // Document payment - DONE
    document.Payment = {};
    document.Payment.PaymentType = "BankTransfer";
    document.Payment.DueDate = transferDateSimple(invoice.ZAHLAVI.DATUM_SPLATNOSTI);
    document.Payment.CurrencyCode = "Kč";
    document.Payment.BankAccount = invoice.DODAVATEL.D_BANKA.D_UCET_BANKY.split("/")[0];
    document.Payment.BankCode = invoice.DODAVATEL.D_BANKA.D_UCET_BANKY.split("/")[1];
    document.Payment.VariableSymbol = invoice.ZAHLAVI.VARIABILNI_SYMBOL;
    // Document VatInfo - DONE
    console.log(invoice.ZAHLAVI.DATUM_ZD_PLNENI)
    document.VatInfo = {};
    document.VatInfo.VatDate = transferDateSimple(invoice.ZAHLAVI.DATUM_ZD_PLNENI);
    document.VatInfo.TaxVoucher = "true";
    document.VatInfo.VatSource = "TaxableValue";
    document.VatInfo.VATTableRow = [];

    document.VatInfo.VATTableRow[0] = {};
    document.VatInfo.VATTableRow[0].VATRate = "21.00";
    document.VatInfo.VATTableRow[0].VATRateCaption = "21%";
    document.VatInfo.VATTableRow[0].TotalTaxableAtRate = invoice.PATICKA.SOUCTOVA_TABULKA1.ZA_ZAKLAD;
    document.VatInfo.VATTableRow[0].VATAtRate = invoice.PATICKA.SOUCTOVA_TABULKA1.ZA_DAN;
    document.VatInfo.VATTableRow[0].TotalWithVAT = invoice.PATICKA.SOUCTOVA_TABULKA1.ZA_CELKEM;

    document.VatInfo.VATTableRow[1] = {};
    document.VatInfo.VATTableRow[1].VATRate = "12.00";
    document.VatInfo.VATTableRow[1].VATRateCaption = "12%";
    document.VatInfo.VATTableRow[1].TotalTaxableAtRate = invoice.PATICKA.SOUCTOVA_TABULKA1.SN1_ZAKLAD;
    document.VatInfo.VATTableRow[1].VATAtRate = invoice.PATICKA.SOUCTOVA_TABULKA1.SN1_DAN;
    document.VatInfo.VATTableRow[1].TotalWithVAT = invoice.PATICKA.SOUCTOVA_TABULKA1.SN1_CELKEM;

    document.VatInfo.VATTableRow[2] = {};
    document.VatInfo.VATTableRow[2].VATRate = "0.00";
    document.VatInfo.VATTableRow[2].VATRateCaption = "--";
    document.VatInfo.VATTableRow[2].TotalTaxableAtRate = invoice.PATICKA.SOUCTOVA_TABULKA1.ZAKLAD;
    document.VatInfo.VATTableRow[2].VATAtRate = "0.00";
    document.VatInfo.VATTableRow[2].TotalWithVAT = invoice.PATICKA.SOUCTOVA_TABULKA1.CELKEM;

    // DocumentTotals
    var taxableTotal = Number(invoice.PATICKA.SOUCTOVA_TABULKA1.ZA_ZAKLAD) + Number(invoice.PATICKA.SOUCTOVA_TABULKA1.SN1_ZAKLAD) + Number(invoice.PATICKA.SOUCTOVA_TABULKA1.ZAKLAD)
    var vatTotal = Number(invoice.PATICKA.SOUCTOVA_TABULKA1.ZA_DAN) + Number(invoice.PATICKA.SOUCTOVA_TABULKA1.SN1_DAN)
    var netTotal = taxableTotal + vatTotal
    var netPaymentTotal = netTotal
    document.DocumentTotals = {};
    document.DocumentTotals.NumberOfLines = "0";
    document.DocumentTotals.NumberOfVATRates = "2";
    document.DocumentTotals.TaxableTotal = taxableTotal.toFixed(FIXED);
    document.DocumentTotals.VatTotal = vatTotal.toFixed(FIXED);
    document.DocumentTotals.NetTotal = netTotal.toFixed(FIXED);
    document.DocumentTotals.AdvancePaymentTotal = "0.00";
    document.DocumentTotals.NetPaymentTotal = netPaymentTotal.toFixed(FIXED);
    document.DocumentTotals.NetPaymentTotalRounding = "0.00";
    document.DocumentTotals.NetPaymentTotalRounded = netPaymentTotal.toFixed(FIXED);
    document.DocumentTotals.TypeOfOperation = "OSL";
    document.DocumentTotals.TypeOfVAT = "U";
    document.DocumentTotals.ProcessVAT = "true";
    document.DocumentTotals.ReverseCharge = "false";

    document.Rows = {}

    return document
}

// // MAIN of the whole process of transforming
// Get the file input element
const fileInput = document.getElementById('fileInput');

// Add an event listener for the 'change' event on the file input
fileInput.addEventListener('change', handleFileSelection);

function handleFileSelection() {
    // Create an instance of the progressBar to give feedback on the flow
    // Usage: myProgressBar.setProgressDone("invalid");
    const myProgressBar = new progressBar();

    // Create an instance of the Notification to give feedback of the flow
    // Usage: myNotification.hide()
    const myNotification = new classNotification();

    // Get all the selected files
    const selectedFiles = fileInput.files;

    // Initialize an empty array to store file read promises
    const promises = [];

    // Create a promise for each selected file
    for (const file of selectedFiles) {
        const promise = new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = () => reject(new Error('Failed to read file'));
            fileReader.readAsText(file);
        });

        promises.push(promise);
    }

    // Concatenate the file contents once all promises are resolved
    Promise.all(promises).then((fileContents) => {
        const concatenatedContent = fileContents.join('\n');
        // console.log(concatenatedContent);
        const trimmedContent = concatenatedContent.replace(/(<\?xml version="1.0" encoding="utf-8" standalone="yes"\?>)/g, '');
        // console.log(trimmedContent);
        let concatFiles = "<fakturkaMultiple>".concat(trimmedContent).concat("</fakturkaMultiple>")
        //console.log(concatFiles);

        // Upload step, parse loaded file
        try {
            const parser = new DOMParser();
            var xml = parser.parseFromString(concatFiles, 'text/xml');
            console.log(xml)
            myProgressBar.setProgressUpload("complete");
        } catch (error) {
            myProgressBar.setProgressUpload("invalid")
            myNotification.error(error)
            return
        }
        // Import step, transfer XML to JSON
        try {
            var jsonIn = xml2json(xml);
            //console.log(jsonIn)
            myProgressBar.setProgressImport("complete");
        } catch (error) {
            myProgressBar.setProgressImport("invalid");
            myNotification.error(error);
            return;
        }

        // Transform step, reform the JSON from Fakturka multiple to Kastner syntax
        try {
            var jsonOut = convertWholeFile(jsonIn)
            myProgressBar.setProgressTransform("complete");
        } catch (error) {
            myProgressBar.setProgressTransform("invalid");
            myNotification.error(error);
            return;
        }

        // Export step, JSON back to XML, prettify
        try {
            var xml3 = OBJtoXML(jsonOut);
            myProgressBar.setProgressExport("complete");
        } catch (error) {
            myProgressBar.setProgressExport("invalid");
            myNotification.error(error);
            return;
        }

        // Done step, Fill the HTML with the finished XML
        try {
            const XMLversion = '<?xml version="1.0" encoding="utf-8"?>'
            var xmlOutput = document.getElementById('xmlOutput');
            xmlOutput.textContent = XMLversion.concat(xml3);
            xmlOutput.textContent = formatXml(xmlOutput.textContent);
            myProgressBar.setProgressDone("complete");
            myNotification.success()
        } catch (error) {
            myProgressBar.setProgressDone("invalid");
            myNotification.error(error);
            return;
        }

    });


    // reader.readAsText(file);

}
