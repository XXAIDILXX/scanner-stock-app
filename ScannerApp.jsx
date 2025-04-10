import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Camera } from "lucide-react";

export default function ScannerApp() {
  const [barcode, setBarcode] = useState("");
  const [qty, setQty] = useState("");
  const [imageData, setImageData] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        const scanner = new Html5Qrcode("reader");
        scanner
          .start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: 250,
            },
            (decodedText) => {
              setBarcode(decodedText);
              scanner.stop();
            },
            (errorMessage) => {
              console.warn(errorMessage);
            }
          )
          .catch((err) => console.error("Scanner error", err));
      });
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleAddRecord = () => {
    if (!barcode || !qty) return alert("Isi barcode dan kuantiti dulu");
    const newRecord = {
      barcode,
      qty,
      image: imageData,
      date: new Date().toISOString(),
    };
    setRecords([...records, newRecord]);
    setBarcode("");
    setQty("");
    setImageData(null);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      records.map((r) => ({
        Barcode: r.barcode,
        Kuantiti: r.qty,
        Tarikh: r.date,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "rekod-stok.xlsx");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">📦 Stok Scanner</h1>
      <div id="reader" className="w-full mb-4" style={{ height: 250 }}></div>

      <div className="mb-4 bg-white p-4 shadow rounded space-y-2">
        <input
          placeholder="Barcode (imbas atau isi manual)"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          placeholder="Kuantiti"
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <label className="flex items-center gap-2">
          <Camera size={20} /> Ambil Gambar
          <input type="file" accept="image/*" capture hidden onChange={handleImageUpload} />
        </label>
        {imageData && <img src={imageData} alt="Preview" className="w-full max-h-48 object-contain" />}
        <button onClick={handleAddRecord} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Tambah Rekod
        </button>
      </div>

      <button onClick={handleExport} className="w-full bg-green-600 text-white p-2 rounded">
        📁 Export ke Excel
      </button>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Rekod Terkini</h2>
        <ul className="space-y-2">
          {records.map((r, i) => (
            <li key={i} className="border p-2 rounded bg-white shadow">
              <div><strong>Barcode:</strong> {r.barcode}</div>
              <div><strong>Kuantiti:</strong> {r.qty}</div>
              <div><strong>Tarikh:</strong> {new Date(r.date).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
