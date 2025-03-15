const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ycbv1lf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db("volunteerDB").collection("users");
    const eventCollection= client.db("volunteerDB").collection("events");
    const postCollection = client.db("volunteerDB").collection("posts");

    // JWT Secret Key
    const JWT_SECRET = process.env.JWT_SECRET;

  // Middleware to Verify Token
// const verifyToken = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1]; // Extract Token
//   if (!token) {
//       return res.status(401).json({ message: "Unauthorized - No token" });
//   }

//   jwt.verify(token, JWT_SECRET, (err, decoded) => {
//       if (err) {
//           return res.status(403).json({ message: "Forbidden - Invalid token" });
//       }
//       req.user = decoded; // Attach user data
//       next();
//   });
// };

// Middleware to Verify Admin Role
// const verifyAdmin = async (req, res, next) => {
//   const user = await userCollection.findOne({ email: req.user.email });
//   if (!user || user.role !== "admin") {
//       return res.status(403).json({ message: "Forbidden - Admins only" });
//   }
//   next();
// };

// **Register a New User**
app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await userCollection.findOne({ email });
  if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user in DB
  const newUser = {
      name,
      email,
      password: hashedPassword,
      // role: "user", // Default role
  };

  const result = await userCollection.insertOne(newUser);
  res.status(201).json({ message: "User registered", userId: result.insertedId });
});

// **Login & Generate JWT Token**
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Case-insensitive email search
  const user = await userCollection.findOne({ email});

  if (!user) {
      return res.status(400).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
  }

  const token = jwt.sign({id:user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({
      message: "Login successful",
      token : token,
      user: { email: user.email, name: user.name }
  });
});



app.post('/profile', async (req, res) => {
    try {
        // Extract Token
        const token = req.headers?.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ status: false, message: "Access Denied" });
        }

        // Verify Token
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded?.id) {
            return res.status(400).json({ status: false, message: "Invalid Token" });
        }

        // Find User in Database
        const user = await userCollection.findOne({ _id: new ObjectId(decoded.id) });
        if (!user) {
            return res.status(400).json({ status: false, message: "User not found" });
        }

        // Return User Data
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
        };

        return res.status(200).json({ status: true, message: "Profile Data", data: userData });

    } catch (error) {
        return res.status(500).json({ status: false, message: "Something went wrong", error: error.message });
    }
});

// event create operation
app.post('/allEvents',async(req,res)=>{
  const newEvents = req.body;
 
  const result = await eventCollection.insertOne(newEvents);
  res.send(result)
})
// read operation
app.get('/allEvents', async(req,res)=>{
  const events = eventCollection.find();
  const result = await events.toArray();
  res.send(result)
})

//community
 app.post('/allPosts',async(req,res)=>{
  const newPost = req.body;
  console.log(newPost)
  const result= await postCollection.insertOne(newPost);
  res.send(result)
 })





// **Get All Users (Protected: Admin Only)**
// app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
//   const result = await userCollection.find().toArray();
//   res.send(result);
// });

// **Get User by Email (Protected)**
// app.get("/allUsers/:email", verifyToken, async (req, res) => {
//   const email = req.params.email;
//   const result = await userCollection.findOne({ email });
//   res.send(result);
// });

// **Logout (Handled on Client-Side)**
// app.post("/logout", (req, res) => {
//   res.json({ message: "Logged out successfully" });
// });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req,res)=>{
    res.send('volunteering platform running')
});

app.listen(port, ()=>{
    console.log(`volunteering platform is running on port: ${port}`)
})