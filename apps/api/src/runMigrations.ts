import "./load-env.js";
import { connectDB } from "./helper/connectDB.js";

await connectDB();
console.log("Migrations complete.");
process.exit(0);
