const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.port || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9nztkwc.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJwt = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, process.env.ACCESS_KEY, function (err, decoded) {
      if (err) {
        res.send({ error: true, message: " unauthorized access" });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.send({ error: true, message: " unauthorized access" });
  }
};

async function run() {
  try {
    const userCollection = client.db("melodyDb").collection("users");

    const verifyRole = async (req, res, next) => {
      const isExist = await userCollection.findOne({
        email: req.query.email,
      });
      if (isExist.role === "admin" || isExist.role === "instructor") {
        req.query.role = isExist?.role;
      }
      res.send({ role: isExist.role });
    };

    app.post("/jwt", (req, res) => {
      const body = req.body;
      const token = jwt.sign(body, process.env.ACCESS_KEY, { expiresIn: "1h" });
      res.send({ token });
    });

    app.get("/users", verifyJwt, async (req, res) => {
      console.log(req.decoded);
      console.log(req.query);
      // if (req.decoded.email === req.query.email) {
      // }
      const result = await userCollection.find().toArray();
      res.send(result);
      // res.send({ message: "forbidden access" });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingsUser = await userCollection.findOne(query);
      if (!existingsUser) {
        const result = await userCollection.insertOne(user);
        res.send(result);
      }
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("summer camping ");
});
app.listen(port, () => {
  console.log(`summer camping is running on ${port}`);
});
