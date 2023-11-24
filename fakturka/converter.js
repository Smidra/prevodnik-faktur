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
    var inputInvoicesArray = ensureArrayFor(jsonIn.FAKTURA)
    inputInvoicesArray.forEach(invoice => {
        jsonOut.DocumentPack.DOCUMENTS.Document[invoiceNr] = convertInvoice(invoice)
        invoiceNr += 1
    });

    // Return the finished converted file
    return jsonOut
}

// Transfer date from 31.12.2023 to 2023-12-31:T00:00:00.00
function transferDate(oldDate){
    var a = oldDate.split(".")[0]
    var b = oldDate.split(".")[1]
    var c = oldDate.split(".")[2]
    var newDate = c.concat("-").concat(b).concat("-").concat(a).concat("T00:00:00.00")
    return newDate
}

function transferDateSimple(oldDate){
    var a = oldDate.split(".")[0]
    var b = oldDate.split(".")[1]
    var c = oldDate.split(".")[2]
    var newDate = c.concat("-").concat(b).concat("-").concat(a)
    return newDate
}


// Script to convert Fakturka invoice in JSON >> Kastner Invoice in JSON
function convertInvoice(invoice) {
    console.log(invoice)
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
    document.VatInfo = {};
    document.VatInfo.VatDate = [];
    document.VatInfo.TaxVoucher = "true";
    document.VatInfo.VatSource = "TaxableValue";
    document.VatInfo.VATTableRow = [];

    document.VatInfo.VATTableRow[0] = {};
    document.VatInfo.VATTableRow[0].VATRate = "0.00";
    document.VatInfo.VATTableRow[0].VATRateCaption = "--";
    document.VatInfo.VATTableRow[0].TotalTaxableAtRate = "0.00";
    document.VatInfo.VATTableRow[0].VATAtRate = "0.00";
    document.VatInfo.VATTableRow[0].TotalWithVAT = "0.00";

    document.VatInfo.VATTableRow[1] = {};
    document.VatInfo.VATTableRow[1].VATRate = "0.00";
    document.VatInfo.VATTableRow[1].VATRateCaption = "--";
    document.VatInfo.VATTableRow[1].TotalTaxableAtRate = "0.00";
    document.VatInfo.VATTableRow[1].VATAtRate = "0.00";
    document.VatInfo.VATTableRow[1].TotalWithVAT = "0.00";


    // DocumentTotals
    document.DocumentTotals = {};
    document.DocumentTotals.NumberOfLines = "0";
    document.DocumentTotals.NumberOfVATRates = "0";
    document.DocumentTotals.TaxableTotal = "0.00";
    document.DocumentTotals.VatTotal = "0.00";
    document.DocumentTotals.NetTotal = "0.00";
    document.DocumentTotals.AdvancePaymentTotal = "0.00";
    document.DocumentTotals.NetPaymentTotal = invoice.PATICKA.CELKEM_K_UHRADE;
    document.DocumentTotals.NetPaymentTotalRounding = "0.00";
    document.DocumentTotals.NetPaymentTotalRounded = invoice.PATICKA.CELKEM_K_UHRADE.concat(".00");
    document.DocumentTotals.TypeOfOperation = "OSL";
    //document.DocumentTotals.TypeOfVAT = "U";
    document.DocumentTotals.ProcessVAT = "false";
    document.DocumentTotals.ReverseCharge = "false";

    return document
}

// MAIN of the whole process of transforming
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('input', () => {
    const file = fileInput.files[0];

    // Create an instance of the progressBar to give feedback on the flow
    // Usage: myProgressBar.setProgressDone("invalid");
    const myProgressBar = new progressBar();

    // Create an instance of the Notification to give feedback of the flow
    // Usage: myNotification.hide()
    const myNotification = new classNotification();

    // Convert the file
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        // Upload step, parse loaded file
        try {
            const parser = new DOMParser();
            var xml = parser.parseFromString(reader.result, 'text/xml');
            myProgressBar.setProgressUpload("complete");
        } catch (error) {
            myProgressBar.setProgressUpload("invalid")
            myNotification.error(error)
            return
        }

        // Import step, transfer XML to JSON
        try {
            var jsonIn = xml2json(xml);
            myProgressBar.setProgressImport("complete");
        } catch (error) {
            myProgressBar.setProgressImport("invalid");
            myNotification.error(error);
            return;
        }

        // Tranform step, reform the JSON from Fakturoid to Kastner syntax
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
    reader.readAsText(file);
});
