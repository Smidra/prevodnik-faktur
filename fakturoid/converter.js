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
    jsonOut.DocumentPack = jsonIn.invoices.invoice.number;
    jsonOut.DocumentPack = {};
    jsonOut.DocumentPack.DOCUMENTS = {};
    jsonOut.DocumentPack.DOCUMENTS.Document = [];

    // Convert each invoice in the input
    var invoiceNr = 0
    var inputInvoicesArray = ensureArrayFor(jsonIn.invoices.invoice)
    inputInvoicesArray.forEach(invoice => {
        jsonOut.DocumentPack.DOCUMENTS.Document[invoiceNr] = convertInvoice(invoice)
        invoiceNr += 1
    });

    // Return the finished converted file
    return jsonOut
}

// https://stackoverflow.com/questions/17197226/calculate-european-iban-with-javascript¨
function isValidIBANNumber(input) {
    var CODE_LENGTHS = {
        AD: 24, AE: 23, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
        CH: 21, CR: 21, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, ES: 24,
        FI: 18, FO: 18, FR: 27, GB: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21,
        HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
        LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27,
        MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29,
        RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, TN: 24, TR: 26
    };
    var iban = String(input).toUpperCase().replace(/[^A-Z0-9]/g, ''), // keep only alphanumeric characters
        code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/), // match and capture (1) the country code, (2) the check digits, and (3) the rest
        digits;
    // check syntax and length
    if (!code || iban.length !== CODE_LENGTHS[code[1]]) {
        return false;
    }
    // Check it is only from CZ - Czech Republic
    if (code[1] !== "CZ") {
        return false;
    }
    // rearrange country code and check digits, and convert chars to ints
    digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, function (letter) {
        return letter.charCodeAt(0) - 55;
    });
    // final check
    return mod97(digits);
}
function mod97(string) {
    var checksum = string.slice(0, 2), fragment;
    for (var offset = 2; offset < string.length; offset += 7) {
        fragment = String(checksum) + string.substring(offset, offset + 7);
        checksum = parseInt(fragment, 10) % 97;
    }
    return checksum;
}


function extractAccountNumberFromIban(iban) {
    const ibanLength = iban.length;
    const countryCode = iban.substring(0, 2);
    const controlNumber = iban.substring(2, 4);
    const bankCodeNumber = iban.substring(4, 8);
    // const prefixNumber = iban.substring(8, 14);
    let prefixNumber = parseInt(iban.substring(8, 14), 10); // Remove prefixed zeroes
    const accountNumber = iban.substring(14, 24);

    if (prefixNumber === 0) {
        prefixNumber = '';
    }

    console.log("Country code:", countryCode);
    console.log("Control number:", controlNumber);
    console.log("Bank code:", bankCodeNumber);
    console.log("Prefix number:", prefixNumber);
    console.log("Account number:", accountNumber);

    return { prefixNumber, accountNumber, bankCodeNumber };
}

// Script to convert Fakturoid invoice in JSON >> Kastner Invoice in JSON
function convertInvoice(invoice) {
    FIXED = 2 // Rounding precision for calculations
    var document = {}
    // Document header - DONE
    document.DocumentHeader = {};
    document.DocumentHeader.DocumentID = invoice.number;
    document.DocumentHeader.TypeOfDocument = "Invoice"
    document.DocumentHeader.DocumentCaption = "FAKTURA - daňový doklad"
    // Document Buyer - DONE
    document.Buyer = {};
    document.Buyer.Address = {};
    document.Buyer.Address.Street = invoice.client_street;
    document.Buyer.Address.City = invoice.client_city;
    document.Buyer.Address.PostalCode = invoice.client_zip;
    document.Buyer.Company = {};
    document.Buyer.Company.Company = invoice.client_name;
    document.Buyer.Company.CompanyRegistrationNo = invoice.client_registration_no;
    document.Buyer.Company.CompanyTaxRegistrationNo = invoice.client_vat_no;
    var custom_code = invoice.client_name.split(" ")[0].toLowerCase().substring(0, 10); // tohle kod firmy v mém programu, jde-li to tak tak malými písmeny první slovo, max. 10 znaků
    document.Buyer.Company.CompanyCode = custom_code;
    // Document Issue - Drobnosti
    document.Issue = {};
    document.Issue.IssueDate = invoice.issued_on.concat("T00:00:00.00");
    // Document payment - DONE
    document.Payment = {};
    document.Payment.PaymentType = "BankTransfer";
    document.Payment.DueDate = invoice.due_on;
    document.Payment.CurrencyCode = "Kč";

    // document.Payment.BankAccount = invoice.bank_account.split("/")[0];
    // document.Payment.BankCode = invoice.bank_account.split("/")[1];
    const iban = invoice.iban;
    console.log("IBAN:", iban);
    if (!isValidIBANNumber(iban)) {
        throw new Error("IBAN is not valid");
    }
    const {prefixNumber, accountNumber, bankCodeNumber} = extractAccountNumberFromIban(iban);
    if (prefixNumber === '') {
        document.Payment.BankAccount = accountNumber;
    }else{
        document.Payment.BankAccount = `${prefixNumber}-${accountNumber}`;
    }
    document.Payment.BankCode = bankCodeNumber;

    document.Payment.VariableSymbol = invoice.variable_symbol;
    // Document VatInfo - DONE
    document.VatInfo = {};
    document.VatInfo.VatDate = invoice.taxable_fulfillment_due;
    document.VatInfo.TaxVoucher = "true";
    document.VatInfo.VatSource = "TaxableValue";
    document.VatInfo.VATTableRow = [];
    // Document VatInfo.VATTableRow
    // Stuff for DocumentTotals
    var lineNumber = 0
    var vatTotal = 0
    var taxableTotal = 0
    // For every line create a new VATTableRow
    invoice.lines.line = ensureArrayFor(invoice.lines.line)
    invoice.lines.line.forEach(line => {
        var totalTaxableAtRate = line.quantity * line.unit_price; // For this VATTableRow
        taxableTotal = taxableTotal + totalTaxableAtRate          // For DocumentTotals
        var vatatrate = line.quantity * (line.unit_price_with_vat - line.unit_price_without_vat); // For VATTableRow
        vatTotal = vatTotal + vatatrate                           // For DocumentTotals
        // When tax is 21% do this
        if (line.vat_rate == 21) {
            document.VatInfo.VATTableRow[lineNumber] = {};
            document.VatInfo.VATTableRow[lineNumber].VATRate = "21.00";
            document.VatInfo.VATTableRow[lineNumber].VATRateCaption = "21%";
            document.VatInfo.VATTableRow[lineNumber].TotalTaxableAtRate = totalTaxableAtRate.toFixed(FIXED);
            document.VatInfo.VATTableRow[lineNumber].VATAtRate = vatatrate.toFixed(FIXED);
            document.VatInfo.VATTableRow[lineNumber].TotalWithVAT = (totalTaxableAtRate + vatatrate).toFixed(FIXED);
        }
        // When tax is 0% do this
        else if (line.vat_rate == 0) {
            document.VatInfo.VATTableRow[lineNumber] = {};
            document.VatInfo.VATTableRow[lineNumber].VATRate = "0.00";
            document.VatInfo.VATTableRow[lineNumber].VATRateCaption = "--";
            document.VatInfo.VATTableRow[lineNumber].TotalTaxableAtRate = totalTaxableAtRate.toFixed(FIXED);
            document.VatInfo.VATTableRow[lineNumber].VATAtRate = "0.00";
            document.VatInfo.VATTableRow[lineNumber].TotalWithVAT = totalTaxableAtRate.toFixed(FIXED);
        }
        lineNumber = lineNumber + 1
    });
    // DocumentTotals
    document.DocumentTotals = {};
    document.DocumentTotals.NumberOfLines = "0";
    document.DocumentTotals.NumberOfVATRates = "1";
    document.DocumentTotals.TaxableTotal = taxableTotal.toFixed(FIXED); // Součet všech TotalTaxableAtRate z řádků výše
    document.DocumentTotals.VatTotal = vatTotal.toFixed(FIXED);
    var netTotal = taxableTotal + vatTotal;
    document.DocumentTotals.NetTotal = netTotal.toFixed(FIXED);
    document.DocumentTotals.AdvancePaymentTotal = "0.00";
    document.DocumentTotals.NetPaymentTotal = netTotal.toFixed(FIXED);
    document.DocumentTotals.NetPaymentTotalRounding = "0.00";
    document.DocumentTotals.NetPaymentTotalRounded = netTotal.toFixed(FIXED);
    document.DocumentTotals.TypeOfOperation = "OSL";
    document.DocumentTotals.TypeOfVAT = "U";
    document.DocumentTotals.ProcessVAT = "true";
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
