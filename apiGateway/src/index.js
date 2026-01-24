import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./.env" });
}
import { app } from "./app.js" ;
import connectDB from './db/connectDB.js';
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running at port: ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("Error in DB Connection: ", error)
})