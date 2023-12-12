// Function to JSON >> XML
function OBJtoXML(obj) {
    var xml = '';
    for (var prop in obj) {
        xml += obj[prop] instanceof Array ? '' : "<" + prop + ">";
        if (obj[prop] instanceof Array) {
            for (var array in obj[prop]) {
                xml += "<" + prop + ">";
                xml += OBJtoXML(new Object(obj[prop][array]));
                xml += "</" + prop + ">";
            }
        } else if (typeof obj[prop] == "object") {
            xml += OBJtoXML(new Object(obj[prop]));
        } else {
            // Replace for 5 special characters in XML
            let newXml = obj[prop].toString()
            newXml = newXml.replace(/&/g, '&amp;');
            newXml = newXml.replace(/</g, '&lt;');
            newXml = newXml.replace(/>/g, '&gt;');
            newXml = newXml.replace(/"/g, '&quot;');
            newXml = newXml.replace(/'/g, '&apos;');
            xml += newXml;
        }
        xml += obj[prop] instanceof Array ? '' : "</" + prop + ">";
    }

    xml = xml.replace(/<\/?[0-9]{1,}>/g, '');

    return xml
}

// Function to XML >> JSON
function xml2json(xml) {
    try {
        var obj = {};
        if (xml.children.length > 0) {
            for (var i = 0; i < xml.children.length; i++) {
                var item = xml.children.item(i);
                var nodeName = item.nodeName;

                if (typeof (obj[nodeName]) == "undefined") {
                    obj[nodeName] = xml2json(item);
                } else {
                    if (typeof (obj[nodeName].push) == "undefined") {
                        var old = obj[nodeName];

                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(xml2json(item));
                }
            }
        } else {
            obj = xml.textContent;
        }
        return obj;
    } catch (e) {
        console.log(e.message);
    }
}

// Function to prettify XML
function formatXml(xml, tab) { // tab = optional indent value, default is tab (\t)
    var formatted = '', indent = '';
    tab = tab || '\t';
    xml.split(/>\s*</).forEach(function (node) {
        if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent by one 'tab'
        formatted += indent + '<' + node + '>\r\n';
        if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;              // increase indent
    });
    return formatted.substring(1, formatted.length - 3);
}