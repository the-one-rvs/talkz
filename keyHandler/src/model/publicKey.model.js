import mongoose,{ Schema } from "mongoose";

const publicKeySchema = new Schema ({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    publickey: {
        type: String,
        required: true
    }
},{
    timestamps: true
})

export const PublicKey = mongoose.model("PublicKey", publicKeySchema)

