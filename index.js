// dns important
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://doctors:RlXqeRM8ea339Ual@cluster0.wwzakej.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } });

async function run() {
  try {
    await client.connect();
    const db = client.db("doctors");
    const doctorsCollection = db.collection("doctors");

    // Get All Doctors
    app.get("/doctors", async (req, res) => {
      const result = await doctorsCollection.find().toArray();
      res.json({ success: true, data: result });
    });

    // Get Single Doctor
    app.get("/doctors/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const result = await doctorsCollection.findOne({ _id: new ObjectId(id) });
      result ? res.json({ success: true, data: result }) : res.status(404).json({ success: false, message: "Not found" });
    });

    app.listen(5000, () => console.log("Server running on port 5000 🚀"));
  } catch (error) {
    console.error(error);
  }
}
run();

