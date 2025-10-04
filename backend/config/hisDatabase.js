import mongoose from "mongoose";

// Separate HIS Database Connection - Cloud MongoDB for all contributors
// Use environment variable if available, fallback to hardcoded URI
const HIS_DATABASE_URI =
  process.env.HIS_MONGODB_URI ||
  "mongodb+srv://jaynab:jaynab.food@cluster0.sn4jwl9.mongodb.net/hospital_his_system";

let hisConnection = null;

const connectHISDatabase = async () => {
  try {
    if (hisConnection && hisConnection.readyState === 1) {
      return hisConnection;
    }

    hisConnection = mongoose.createConnection(HIS_DATABASE_URI);

    // Wait for connection to be established
    await new Promise((resolve, reject) => {
      hisConnection.on("connected", () => {
        console.log("✅ HIS Database Connected Successfully");
        resolve();
      });

      hisConnection.on("error", (err) => {
        console.error("❌ HIS Database Connection Error:", err);
        reject(err);
      });

      hisConnection.on("disconnected", () => {
        console.log("🔌 HIS Database Disconnected");
      });
    });

    return hisConnection;
  } catch (error) {
    console.error("❌ Failed to connect to HIS Database:", error);
    throw error;
  }
};

// Get HIS Database Connection
const getHISConnection = () => {
  if (!hisConnection) {
    throw new Error(
      "HIS Database not connected. Call connectHISDatabase() first."
    );
  }
  return hisConnection;
};

export { connectHISDatabase, getHISConnection };
export default hisConnection;
