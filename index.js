//dns importent
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const app = express();
const cors = require('cors');
const port=process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
//cors
app.use(cors());
app.use(express.json());

//mongodb
const uri = `mongodb+srv://doctors:RlXqeRM8ea339Ual@cluster0.wwzakej.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// async function
const run = async () => {
try{
await client.connect();

const db=client.db("doctors");
const doctorsCollection=db.collection("users");   

app.get("/doctors",async(req,res)=>{
    const cursor=doctorsCollection.find();
    const result=await cursor.toArray();
    res.send(result);
});

await client.db("admin").command({ ping: 1 });
console.log("Pinged your deployment. You successfully connected to MongoDB!");
}
finally{

}
}
   run().catch(console.dir);








//eta ager
app.get('/', (req, res) => {
    res.send('Hello World!')
}       
);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});




//doctors
//RlXqeRM8ea339Ual