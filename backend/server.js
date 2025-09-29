const express = require("express");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { env } = require("process");

const app = express();
const server = http.createServer(app);

app.use(cors());
const ORIGIN =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:3000";

// Initialise instance of socket.io
const io = new Server(server, {
  cors: {
    origin: ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Create a Supabase Client. Load from .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initial meter readings
const initialReadings = {
  "SMR-98756-1-A": 1000,
  "SMR-43563-2-A": 2000,
  "SMR-65228-1-B": 3000,
};

let readings = {...initialReadings};

// Fetch the last saved reading for each meter from Supabase on server start
const fetchLastReading = async (meter_id) => {
  const { data, error } = await supabase
    .from("readings")
    .select("reading")
    .eq("meter_id", meter_id)
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error(
      `Error fetching last reading for meter ${meter_id}:`,
      error.message
    );
    return null;
  }
  return data.length > 0 ? data[0].reading : null;
};

// Function to generate new reading with peak hour simulation
const generateReading = (meter_id) => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeOfDay = hours + minutes / 60;
  
  // Base consumption rate
  let consumptionRate = 0.05; // kWh per interval
  
  // Adjust for peak hours (4:00 PM to 7:00 PM)
  if (hours >= 16 && hours < 19) {
    // Peak hours - 1.5x to 2x normal consumption
    consumptionRate *= (1.5 + Math.random() * 0.5);
  } else if (hours >= 23 || hours < 6) {
    // Overnight - reduced consumption (50-70% of normal)
    consumptionRate *= (0.5 + Math.random() * 0.2);
  } else if ((hours >= 6 && hours < 9) || (hours >= 17 && hours < 22)) {
    // Morning and evening - slightly elevated consumption
    consumptionRate *= (1.1 + Math.random() * 0.2);
  }
  
  // Add small random fluctuations
  const fluctuation = Math.random() * 0.02;
  consumptionRate += fluctuation;
  
  // Apply the consumption rate
  readings[meter_id] += consumptionRate;
  
  // Check if reading exceeds 10000 kWh
  if (readings[meter_id] > 10000) {
    console.log(`Meter ${meter_id} exceeded 10000 kWh. Resetting to initial value.`);
    readings[meter_id] = initialReadings[meter_id];
  }
  
  return parseFloat(readings[meter_id].toFixed(3));
};

// Function to save reading to Supabase
const saveReadingToDb = async (meter_id, reading) => {
  const timestamp = new Date().toISOString(); // Current timestamp
  const { data, error } = await supabase.from("readings").insert([
    {
      timestamp: timestamp,
      meter_id: meter_id, // Save meter_id
      reading: reading,
    },
  ]);

  if (error) {
    console.error(
      `Error inserting reading for meter ${meter_id}:`,
      error.message
    );
  } else {
    console.log(
      `Reading for meter ${meter_id} saved: ${reading} at ${timestamp}`
    );
  }
};

// Function to get current consumption rate for display
const getCurrentConsumptionRate = () => {
  const now = new Date();
  const hours = now.getHours();
  
  if (hours >= 16 && hours < 19) {
    return "High (Peak Hours: 4PM-7PM)";
  } else if (hours >= 23 || hours < 6) {
    return "Low (Overnight Hours)";
  } else {
    return "Normal";
  }
};

// Start the server
(async () => {
  // Initialize readings for each predefined meter
  for (const meter_id of Object.keys(readings)) {
    const lastReading = await fetchLastReading(meter_id);
    if (lastReading) {
      readings[meter_id] = parseFloat(lastReading); // Start from the last saved reading
      console.log(
        `Starting with last saved reading for meter ${meter_id}: ${readings[meter_id]}`
      );
    } else {
      console.log(
        `No previous readings found for meter ${meter_id}. Starting from default: ${readings[meter_id]}`
      );
    }
  }

  // WebSocket connection. emitInterval and saveInterval both run concurrently to maintain data ingestion
  io.on("connection", (socket) => {
    console.log("A user connected");

    const latestReadings = {}; // Store the latest reading for each meter

    // Emit readings every 2 seconds
    const emitInterval = setInterval(() => {
      for (const meter_id of Object.keys(readings)) {
        const newReading = generateReading(meter_id);
        const consumptionRate = getCurrentConsumptionRate();

        // Send the reading to the client
        socket.emit("newReading", { 
          meter_id, 
          reading: newReading,
          consumption_rate: consumptionRate,
          timestamp: new Date().toISOString()
        });

        // Store the latest reading for each meter
        latestReadings[meter_id] = newReading;
      }
    }, 2000); // Emit every 2 seconds

    // Save the latest reading to the database every 60 seconds
    const saveInterval = setInterval(() => {
      for (const meter_id of Object.keys(latestReadings)) {
        const latestReading = latestReadings[meter_id];

        // Save the latest reading for the meter to the DB
        if (latestReading) {
          saveReadingToDb(meter_id, latestReading);
        }
      }
    }, 60000); // Save every 60 seconds

    // Clean up on socket disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected");
      clearInterval(emitInterval);
      clearInterval(saveInterval);
    });
  });

  server.listen(3001, () => {
    console.log("Server is running on port 3001");
    console.log("Simulating UK electricity usage patterns with peak hours (4PM-7PM)");
  });
})();