const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.port || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  const token = req?.headers?.authorization;

  if (token) {
    jwt.verify(token, process.env.ACCESS_KEY, (err, decoded) => {
      if (err) {
        res.status(401).send({ error: true, message: " unauthorized access" });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.status(401).send({ error: true, message: " unauthorized access" });
  }
};

async function run() {
  try {
    const userCollection = client.db("melodyDb").collection("users");
    const classCollection = client.db("melodyDb").collection("classes");

    const verifyRole = async (req, res, next) => {
      const isExist = await userCollection.findOne({
        email: req.query.email,
      });
      if (isExist.role === "admin" || isExist.role === "instructor") {
        req.query.role = isExist?.role;
        next();
      } else {
        res.send({ role: isExist.role });
      }
    };

    app.post("/jwt", (req, res) => {
      const data = req.body;
      const token = jwt.sign(data, process.env.ACCESS_KEY, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.get("/role", verifyJwt, verifyRole, async (req, res) => {
      if (req.decoded.email === req.query.email) {
        res.send({ role: req.query.role });
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });

    app.patch("/updateStatus/:id", verifyJwt, verifyRole, async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: body.status,
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
      console.log(id, body);
    });

    app.patch("/allClasses/:id", verifyJwt, verifyRole, async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          className: body.className,
          price: body.price,
          seats: body.seats,
        },
      };
      console.log(updateDoc);
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/allClasses", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    app.delete("/allClasses/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/manageClasses", async (req, res) => {
      const result = await classCollection
        .find({
          email: { $eq: req.query.email },
        })
        .toArray();
      res.send(result);
    });

    app.post("/manageClasses", verifyJwt, verifyRole, async (req, res) => {
      const body = req.body;
      const result = await classCollection.insertOne(body);
      res.send(result);
    });

    app.delete("/manageClasses/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/users", verifyJwt, async (req, res) => {
      if (req.decoded.email === req.query.email) {
        const result = await userCollection.find().toArray();
        res.send(result);
      } else {
        res.send({ message: "forbidden access" });
      }
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

    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: body.role,
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
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
