import Admin from "./models/Admin.js"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import dotenv from 'dotenv';

dotenv.config()

const seed = async () => {
    const ADMIN = {
        role: "Admin",
        name: "admin",
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        approved: true
    }

    const hashedPassword = await bcrypt.hash(ADMIN.password, 12)

    try {
        if (!process.env.MONGO_URI) {
            throw Error("No MONGO_URI specified in environment variables")
        }

     
        await mongoose.connect(process.env.MONGO_URI)

        
        const existingAdmin = await Admin.findOne({ email: ADMIN.email });

        if (existingAdmin) {
            console.log("ADMIN_ALREADY_EXISTS:");
            console.log(`EMAIL: ${ADMIN.email}`);
            process.exit(0);
        }

        
        const admin = await Admin.create({
            ...ADMIN,
            password: hashedPassword
        });

        if (admin) {
            console.log("ADMIN_CREATED_SUCCESSFULLY:");
            console.log(`EMAIL: ${ADMIN.email}`);
            console.log(`PASSWORD: ${ADMIN.password}`);
            process.exit(0);
        }

    } catch (err) {
        console.error("SEED_ERROR: ", err);
        process.exit(1);  
    }
}

seed();
