const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://doctors:RlXqeRM8ea339Ual@cluster0.wwzakej.mongodb.net/?appName=Cluster0";

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
      const result = await doctorsCollection.find().toArray();
      res.send({ success: true, data: result });
    });

    app.get("/doctors/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, message: "Invalid ID" });
      }
      const result = await doctorsCollection.findOne({ _id: new ObjectId(id) });
      if (!result) {
        return res.status(404).send({ success: false, message: "Doctor not found" });
      }
      res.send({ success: true, data: result });
    });

    // ---------------- APPOINTMENTS ----------------

    app.post("/appointments", async (req, res) => {
      try {
        const appointment = req.body;
        const result = await appointmentsCollection.insertOne(appointment);
        res.send({ success: true, insertedId: result.insertedId, message: "Appointment booked successfully" });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to save appointment" });
      }
    });

    // appointments by email
    app.get("/appointments/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await appointmentsCollection.find({ userEmail: email }).toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to fetch appointments" });
      }
    });
    // নির্দিষ্ট ইমেইল এবং আইডি দিয়ে একটি অ্যাপয়েন্টমেন্ট পাওয়ার রুট
app.get("/appointments/:email/:id", async (req, res) => {
  try {
    const email = req.params.email;
    const id = req.params.id;

    // ডাটাবেসে কুয়েরি: ইমেইল এবং আইডি দুটোই মিলতে হবে
    const result = await appointmentsCollection.findOne({
      userEmail: email,
      _id: new ObjectId(id)
    });

    if (!result) {
      return res.status(404).send({ success: false, message: "Appointment not found" });
    }

    res.send({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Failed to fetch appointment" });
  }
});

    // DELETE appointment by ID
    app.delete("/appointments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await appointmentsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ success: true, deletedCount: result.deletedCount });
      } catch (error) {
        res.status(500).send({ success: false, message: "Failed to delete appointment" });
      }
    });
    // edit appointment
app.put("/appointments/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      appointmentDate: updatedData.appointmentDate,
      appointmentTime: updatedData.appointmentTime,
    
    },
  };
  const result = await appointmentsCollection.updateOne(filter, updateDoc);
  res.send({ success: true, result });
});

    app.listen(5000, () => console.log("Server running on port 5000 🚀"));
  } catch (error) {
    console.log(error);
  }
}

// ---------------- REGISTRATION ----------------
app.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // চেক করা ইউজার আগে থেকেই আছে কিনা
    const existingUser = await doctorsCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ success: false, message: "User already exists" });
    }

    // এখানে পাসওয়ার্ড হ্যাশ করা উচিত (bcrypt ব্যবহার করে)
    const newUser = { email, password, name, role: "user" };
    const result = await doctorsCollection.insertOne(newUser);
    
    res.send({ success: true, message: "User registered successfully", insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: "Registration failed" });
  }
});

// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await doctorsCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    // পাসওয়ার্ড চেক (bcrypt.compare ব্যবহার করবেন)
    if (user.password !== password) {
      return res.status(401).send({ success: false, message: "Invalid password" });
    }

    res.send({ success: true, message: "Login successful", user: { email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).send({ success: false, message: "Login failed" });
  }
});

run();