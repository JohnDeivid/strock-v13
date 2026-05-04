const { jsPDF } = require("jspdf");
const doc = new jsPDF();
try {
  doc.setGState(new doc.GState({opacity: 0.07}));
  console.log("doc.GState works");
} catch(e) {
  console.log("doc.GState failed:", e.message);
}
try {
  doc.setGState(new jsPDF.GState({opacity: 0.07}));
  console.log("jsPDF.GState works");
} catch(e) {
  console.log("jsPDF.GState failed:", e.message);
}
try {
  doc.setGState(doc.GState({opacity: 0.07}));
  console.log("doc.GState without new works");
} catch(e) {
  console.log("doc.GState without new failed:", e.message);
}
