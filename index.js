const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

// ================= CORS (সহজ ও ১০০% কার্যকরী Vercel সেটআপ) =================
const allowedOrigins = [
  "http://localhost:3000",
  "https://assignment-9-client-beta.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // ব্রাউজারের বাইরের রিকোয়েস্ট (যেমন Postman) বা লিস্টে থাকা অরিজিনকে অনুমতি দিন
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200 // পুরোনো ব্রাউজারগুলোর জন্য স্ট্যাটাস কোড ফিক্স
}));

// প্রি-ফ্লাইট (Pre-flight) রিকোয়েস্ট গ্লোবালি হ্যান্ডেল করা
app.options("", cors()); // 💡 এখানে "*" কেটে শুধু খালি স্ট্রিং বা বাদ দিন
app.use(express.json());

// ================= MONGODB =================
let client;
let db;

let doctorCollection;
let bookingCollection;
let userCollection;

async function connectDB() {
  if (!client) {
    // 💡 আপনার কোডে MONGO_URI ছিল, নিশ্চিত হোন Vercel-এ এই নামেই Environment Variable সেট করা আছে
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();

    db = client.db("docappointDB");

    doctorCollection = db.collection("doctors");
    bookingCollection = db.collection("bookings");
    userCollection = db.collection("users");
  }
}

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("DocAppoint Backend Running");
});

// ================= DOCTORS =================
app.get("/doctors", async (req, res) => {
  try {
    await connectDB();
    const result = await doctorCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/doctors/:id", async (req, res) => {
  try {
    await connectDB();
    const result = await doctorCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ================= USERS =================
app.post("/users", async (req, res) => {
  try {
    await connectDB();
    const user = req.body;
    const exist = await userCollection.findOne({ email: user.email });

    if (exist) {
      return res.send({ message: "User already exists" });
    }

    const result = await userCollection.insertOne(user);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ================= BOOKINGS =================

// CREATE
app.post("/bookings", async (req, res) => {
  try {
    await connectDB();
    const booking = req.body;
    const result = await bookingCollection.insertOne({
      ...booking,
      createdAt: new Date(),
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// GET BOOKINGS BY EMAIL (💡 এখানে ফিক্স করা হয়েছে)
app.get("/bookings", async (req, res) => {
  try {
    await connectDB();

    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ error: "Email query parameter is required" });
    }

    // ডাটাবেজে যদি userEmail ফিল্ডে ইমেইল সেভ করা থাকে, তবে এটি ঠিক আছে
    const result = await bookingCollection
      .find({ userEmail: email })
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// UPDATE BOOKING
app.patch("/bookings/:id", async (req, res) => {
  try {
    await connectDB();
    const result = await bookingCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          patientName: req.body.patientName,
          phone: req.body.phone,
          appointmentDate: req.body.appointmentDate,
          appointmentTime: req.body.appointmentTime,
        },
      }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// DELETE BOOKING
app.delete("/bookings/:id", async (req, res) => {
  try {
    await connectDB();
    const result = await bookingCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ================= EXPORT (Vercel) =================
module.exports = app;