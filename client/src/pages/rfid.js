// rfid.js
import express from 'express';
import cors from "cors";

const app = express();
const PORT = 5001;

app.use(cors());

const tags = [
  { type: "EM4100", frequency: "125kHz", uid: "0xA1B2C3D4E5", source: "RFID" },
  { type: "HID Prox", frequency: "125kHz", uid: "0xDEADBEEF01", source: "RFID" },
  { type: "EM4100", frequency: "125kHz", uid: "0xAE3456789A", source: "RFID" },
  { type: "EM4100", frequency: "125kHz", uid: "0x1R3456789A", source: "RFID" },
  { type: "EM4100", frequency: "125kHz", uid: "0x123456789A", source: "RFID" }
];

let latestTag = null;

function generateRFIDTag() {
  const tag = tags[Math.floor(Math.random() * tags.length)];
  latestTag = {
    ...tag,
    timestamp: new Date().toISOString()
  };
  console.log("📡 New RFID Tag:", latestTag);
}

setInterval(generateRFIDTag, 10000);
generateRFIDTag();

app.get("/rfid-scan", (req, res) => {
  if (latestTag) {
    res.json(latestTag);
  } else {
    res.status(404).json({ message: "No RFID tag yet" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ RFID server running at http://localhost:${PORT}`);
});
