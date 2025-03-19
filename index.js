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
    const messageCollection= client.db("volunteerDB").collection("messages")

    // JWT Secret Key
    const JWT_SECRET = process.env.JWT_SECRET;


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
  // console.log("Generated Token:", token);

  res.json({
      message: "Login successful",
      token : token,
      user: { email: user.email, name: user.name }
  });
});



app.post('/profile', async (req, res) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ status: false, message: "Access Denied" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded?.id) {
            return res.status(400).json({ status: false, message: "Invalid Token" });
        }

        const userId = new ObjectId(decoded.id);

        // Fetch user data
        const user = await userCollection.findOne({ _id: userId });
        if (!user) {
            return res.status(400).json({ status: false, message: "User not found" });
        }

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
        };

        // Fetch posts created by user
        const userPosts = await postCollection.find({ creatorId: userId }).toArray();
        console.log("✅ User Posts: ", userPosts);

        // Extract post IDs
        const postIds = userPosts.map(post => post._id);
        console.log("✅ Post IDs: ", postIds);


        // Fetch replies on user's posts (excluding their own replies)
        const userReplies = await messageCollection.find({
            postId: { $in: postIds },
            senderId: { $ne: userId }  // Ensure sender is not the post owner
        }).toArray();
        console.log("✅ User Replies: ", userReplies);



        return res.status(200).json({
            status: true,
            message: "Profile Data",
            data: {
                ...userData,
                posts: userPosts,
                replies: userReplies
            }
        });

    } catch (error) {
        console.error("❌ Error fetching profile: ", error);
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

app.post('/allPosts', async (req, res) => {
    try {
        // Extract token from headers
        const token = req.headers?.authorization?.split(" ")[1];
        // console.log("Received Token:", token);

        if (!token) {
            return res.status(401).json({ status: false, message: "Access Denied: No Token" });
        }

        // Verify and decode the token for allPost
        const decoded = jwt.verify(token, JWT_SECRET);
        // console.log("Decoded Token:", decoded);
        if (!decoded?.id) {
            return res.status(400).json({ status: false, message: "Invalid Token" });
        }

        // Find user by decoded id
        const user = await userCollection.findOne({ _id: new ObjectId(decoded.id) });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        

        // Get post data from the request body
        const { about, category, location, urgency } = req.body;

        // Create new post object with user ID
        const newPost = {
            about,
            category,
            location,
            urgency,
            creatorId: user._id, // Save the user ID from the token
            createdAt: new Date(),
        };

        // Insert post into the database
        const result = await postCollection.insertOne(newPost);

        res.status(201).json({ status: true, message: "Post created successfully", data: result });

    } catch (error) {
        console.error("Error creating post: ", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

//  read operation for community post
app.get('/allPosts', async(req,res)=>{
  const posts = postCollection.find();
  const result = await posts.toArray();
  res.send(result)
})

// private message
app.post('/allMessages', async (req, res) => {
    try {
      // Extract token from headers
      const token = req.headers?.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ status: false, message: "Access Denied: No Token" });
      }
  
      // Verify and decode the token
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded?.id) {
        return res.status(400).json({ status: false, message: "Invalid Token" });
      }
  
      // Find user by decoded id
      const user = await userCollection.findOne({ _id: new ObjectId(decoded.id) });
      if (!user) {
        return res.status(404).json({ status: false, message: "User not found" });
      }
  
      // Extract data from request body
      const { postId, message, creatorId } = req.body;
  
      // Validate required fields
      if (!postId || !message || !creatorId) {
        return res.status(400).json({ status: false, message: "Missing required fields" });
      }
  
      // Find the corresponding post using postId
      const post = await postCollection.findOne({ _id: new ObjectId(postId) });
      if (!post) {
        return res.status(404).json({ status: false, message: "Post not found" });
      }
  
      // Prevent post creator from replying to their own post
      if (creatorId === user._id.toString()) {
        return res.status(403).json({ status: false, message: "You cannot reply to your own post." });
      }
  
      // Save the new message
      const newMessage = {
        postId: post._id,      // Correct postId
        senderId: user._id,    // User sending the message
        message,
        creatorId,             // Post creator
        createdAt: new Date(),
      };
  
      const result = await messageCollection.insertOne(newMessage);
  
      res.status(201).json({
        status: true,
        message: "Message sent successfully",
        data: result.insertedId,
      });
  
    } catch (error) {
      console.error("Error sending message: ", error);
      res.status(500).json({ status: false, message: "Internal Server Error" });
    }
  });
  







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