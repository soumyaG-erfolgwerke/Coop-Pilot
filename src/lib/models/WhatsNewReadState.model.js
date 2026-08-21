import mongoose from "mongoose";

const WhatsNewReadStateSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    lastReadAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "whats_new_read_state", versionKey: false },
);

export default mongoose.models.WhatsNewReadState ||
  mongoose.model("WhatsNewReadState", WhatsNewReadStateSchema);
