const { jsPDF } = require("jspdf");
const doc = new jsPDF();
doc.text("Hello", 10, 10);
const out = doc.output("datauristring");
console.log(out.substring(0, 100));
const regex = /^data:application\/pdf;[^,]+,/;
console.log("Regex matches?", regex.test(out));
console.log("Replaced:", out.replace(regex, "").substring(0, 100));
