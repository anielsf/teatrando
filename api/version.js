export default function handler(req, res) {
  res.status(200).json({ version: "v2-ca-cert", timestamp: Date.now() });
}
