process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors({
  origin: [
    "https://doctor-app-client-opal.vercel.app",
    "https://doctor-app-client.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("doctors");
    const doctorsCollection = db.collection("users");
    const appointmentsCollection = db.collection("appointments");

    console.log("MongoDB Connected ✅");

    // ---------------- DOCTORS ----------------
    app.get("/doctors", async (req, res) => {
      try {
        const result = await doctorsCollection.find().toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to fetch doctors" });
      }
    });

    app.get("/doctors/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid ID" });
        }
        const result = await doctorsCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          return res.status(404).send({ success: false, message: "Doctor not found" });
        }
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to fetch doctor" });
      }
    });

    // ---------------- APPOINTMENTS ----------------

    app.get("/appointments", async (req, res) => {
      try {
        const result = await appointmentsCollection.find().toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to fetch all appointments" });
      }
    });

    app.get("/appointments/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await appointmentsCollection.find({ email: email }).toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to fetch appointments" });
      }
    });

    app.post("/appointments", async (req, res) => {
      try {
        const appointment = req.body;
        const { doctorName, email, patientName, gender, phone, appointmentDate, appointmentTime } = appointment;
        if (!doctorName || !email || !patientName || !gender || !phone || !appointmentDate || !appointmentTime) {
          return res.status(400).send({ success: false, message: "All fields are required" });
        }
        const result = await appointmentsCollection.insertOne(appointment);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to save appointment" });
      }
    });

    app.delete("/appointments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid ID" });
        }
        const result = await appointmentsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to delete appointment" });
      }
    });

    app.put("/appointments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid ID" });
        }
        const updatedData = req.body;
        const result = await appointmentsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to update" });
      }
    });

    // ---------------- REGISTER & LOGIN ----------------

    app.post("/register", async (req, res) => {
      try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
          return res.status(400).send({ success: false, message: "All fields required" });
        }
        const existingUser = await doctorsCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).send({ success: false, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await doctorsCollection.insertOne({
          email,
          password: hashedPassword,
          name,
          role: "user",
        });
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, message: "Registration failed" });
      }
    });

    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).send({ success: false, message: "Email and password required" });
        }
        const user = await doctorsCollection.findOne({ email });
        if (!user) {
          return res.status(401).send({ success: false, message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).send({ success: false, message: "Invalid credentials" });
        }
        res.send({ success: true, user: { email: user.email, name: user.name, role: user.role } });
      } catch (error) {
        res.status(500).send({ success: false, message: "Login failed" });
      }
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));

  } catch (error) {
    console.log("Connection error:", error);
    process.exit(1);
  }
}

run();