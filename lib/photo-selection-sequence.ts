
import mongoose from "mongoose";

import PhotoSelectionEvent from "@/models/PhotoSelectionEvent";
import PhotoSelectionPhoto from "@/models/PhotoSelectionPhoto";

/**
 * Ensures an event's sequence counter is initialized from
 * its actual highest existing photo sequence.
 *
 * Only one request can claim initialization at a time.
 */
export async function ensurePhotoSequenceInitialized(
  eventId: mongoose.Types.ObjectId
): Promise<void> {
  const lockDurationMs = 30_000;
  const now = new Date();
  const lockUntil = new Date(now.getTime() + lockDurationMs);

  const event = await PhotoSelectionEvent.findOneAndUpdate(
    {
      _id: eventId,
      sequenceInitialized: { $ne: true },
      $or: [
        { sequenceInitLockUntil: { $exists: false } },
        { sequenceInitLockUntil: null },
        { sequenceInitLockUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        sequenceInitLockUntil: lockUntil,
      },
    },
    { new: true }
  )
    .select({ _id: 1 })
    .lean();

  if (!event) {
    const currentEvent = await PhotoSelectionEvent.findById(eventId)
      .select({
        sequenceInitialized: 1,
        sequenceInitLockUntil: 1,
      })
      .lean();

    if (!currentEvent) {
      throw new Error("Photo Selection event not found");
    }

    if (currentEvent.sequenceInitialized) {
      return;
    }

    // Another request owns the lock. Do not allocate a sequence yet.
    throw new Error(
      "Photo sequence initialization is in progress. Please retry."
    );
  }

  try {
    const lastPhoto = await PhotoSelectionPhoto.findOne({ eventId })
      .sort({ sequence: -1 })
      .select({ sequence: 1 })
      .lean();

    const nextSequence =
      typeof lastPhoto?.sequence === "number"
        ? lastPhoto.sequence + 1
        : 0;

    const initialized = await PhotoSelectionEvent.updateOne(
      {
        _id: eventId,
        sequenceInitialized: { $ne: true },
        sequenceInitLockUntil: lockUntil,
      },
      {
        $max: { nextPhotoSequence: nextSequence },
        $set: { sequenceInitialized: true },
        $unset: { sequenceInitLockUntil: 1 },
      }
    );

    if (initialized.modifiedCount !== 1) {
      throw new Error("Failed to initialize photo sequence counter");
    }
  } catch (error) {
    // Release only the lock acquired by this request.
    await PhotoSelectionEvent.updateOne(
      {
        _id: eventId,
        sequenceInitialized: { $ne: true },
        sequenceInitLockUntil: lockUntil,
      },
      { $unset: { sequenceInitLockUntil: 1 } }
    );

    throw error;
  }
}
