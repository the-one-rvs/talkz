import mongoose,{ Schema } from "mongoose";

const keySchema = new Schema ({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    publickey: {
        type: String,
        required: true
    },
    privatekey: {
        type: String,
        required: true
    }
},{
    timestamps: true
})

export const Key = mongoose.model("Key", keySchema)

