const express = require("express");
const app = express();
const dotenv = require("dotenv");

// load env (Docker/K8s env vars still win)
dotenv.config({ path: "config.env" });

const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";      // bind to all interfaces
const BASE = process.env.BASE_PATH || "/api";    // prefix all API routes

const connect = require("./database/mongoDb");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const studentRoutes = require("./routes/student.routes");
const adminRoutes = require("./routes/admin.routes");
const careerServiceRoutes = require("./routes/careerService.routes");
const facultyRoute = require("./routes/facultyRoute");
const questionUploadRoute = require("./routes/questionUpload.routes");
const batchRegisterRoute = require("./routes/batchRegister.route");
const getBatchRoute = require("./routes/common.route");
const attendanceRoute = require("./routes/attendance.routes");

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// ---- health & root ----
app.get("/", (_req, res) => {
  res.send("Backend is up. Try " + BASE + "/health");
});
app.get(`${BASE}/health`, (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ---- mount all routes under BASE (e.g., /api/...) ----
app.use(`${BASE}/student`, studentRoutes);
app.use(`${BASE}/admin`, adminRoutes);
app.use(`${BASE}/careerService`, careerServiceRoutes);
app.use(`${BASE}/faculty`, facultyRoute);
app.use(BASE, getBatchRoute);                 // routes defined at "/" inside the router
app.use(BASE, questionUploadRoute);           // routes defined at "/"
app.use(`${BASE}/batch`, batchRegisterRoute);
app.use(`${BASE}/attendance`, attendanceRoute);

// ---- start ----
app.listen(port, host, () => {
  connect();
  console.log(`Server listening on http://${host}:${port} (base: ${BASE})`);
});
