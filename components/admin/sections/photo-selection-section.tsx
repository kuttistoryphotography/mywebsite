"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type PhotoSelectionEvent = {
  id: string;
  eventCode: string;
  eventName: string;
  clientName: string;
  totalPhotos: number;
  selectionLimit: number;
  status: "active" | "submitted" | "closed";
};

export default function PhotoSelectionSection() {
  const [events, setEvents] = useState<PhotoSelectionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [selectionLimit, setSelectionLimit] = useState("250");

  const [creating, setCreating] = useState(false);

  const [selectedEvent, setSelectedEvent] =
    useState<PhotoSelectionEvent | null>(null);

  const [showManageModal, setShowManageModal] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  type PhotoSelectionPhoto = {
    id: string;
    photoId: string;
    fileId: string;
    originalFilename: string;
    cloudinaryPublicId: string | null;
    cloudinaryUrl: string | null;
    thumbnailUrl: string | null;
    previewUrl: string | null;
    sequence: number;
    };

    const [eventPhotos, setEventPhotos] =
    useState<PhotoSelectionPhoto[]>([]);

    const [loadingPhotos, setLoadingPhotos] =
    useState(false);

    const [showSelectionModal, setShowSelectionModal] =
      useState(false);

    type ClientSelectedPhoto = {
      id: string;
      originalFilename: string;
      thumbnailUrl: string | null;
      previewUrl: string | null;
      sequence: number | null;
      decidedAt?: string;
    };

    const [selectedPhotos, setSelectedPhotos] =
      useState<ClientSelectedPhoto[]>([]);

    const [rejectedPhotos, setRejectedPhotos] =
      useState<ClientSelectedPhoto[]>([]);

    const [loadingSelection, setLoadingSelection] =
      useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/photo-selection/events",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error(
        "Failed to load photo selection events:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function createEvent() {
    if (!eventName.trim()) {
      alert("Enter event name");
      return;
    }

    if (!eventCode.trim()) {
      alert("Enter event code");
      return;
    }

    if (!clientName.trim()) {
      alert("Enter client name");
      return;
    }

    const limit = Number(selectionLimit);

    if (!limit || limit < 1) {
      alert("Enter a valid selection limit");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(
        "/api/photo-selection/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventCode,
            eventName,
            clientName,
            selectionLimit: limit,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to create event"
        );
      }

      setShowCreateModal(false);

      setEventName("");
      setEventCode("");
      setClientName("");
      setSelectionLimit("250");

      await loadEvents();

      alert("Photo Selection event created successfully");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create event"
      );
    } finally {
      setCreating(false);
    }
  }

  async function openManageEvent(
    event: PhotoSelectionEvent
    ) {
    setSelectedEvent(event);
    setShowManageModal(true);

    try {
        setLoadingPhotos(true);
        setEventPhotos([]);

        const response = await fetch(
        `/api/photo-selection/events/${event.id}/photos`,
        {
            cache: "no-store",
        }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
        throw new Error(
            data.error || "Failed to load photos"
        );
        }

        setEventPhotos(data.photos || []);
    } catch (error) {
        console.error(error);

        alert(
        error instanceof Error
            ? error.message
            : "Failed to load photos"
        );
    } finally {
        setLoadingPhotos(false);
    }
  }

  async function openSelection(
    event: PhotoSelectionEvent
  ) {
    setSelectedEvent(event);
    setShowSelectionModal(true);
    setLoadingSelection(true);

    try {
      const response = await fetch(
        `/api/photo-selection/events/${event.id}/selection`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to load client selection"
        );
      }

      setSelectedPhotos(data.selected || []);
      setRejectedPhotos(data.rejected || []);
    } catch (error) {
      console.error(
        "[Photo Selection] Failed to load selection:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load client selection"
      );

      setShowSelectionModal(false);
    } finally {
      setLoadingSelection(false);
    }
  }

  function openUpload(event: PhotoSelectionEvent) {
    setSelectedEvent(event);
    setUploadProgress(0);
    setUploadStatus("");

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  }

  async function deletePhoto(
    photo: PhotoSelectionPhoto
  ) {
    const confirmed = window.confirm(
        `Delete "${photo.originalFilename}"?\n\nThis will permanently remove the photo from this Photo Selection event and File Manager.`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
        `/api/photo-selection/events/${selectedEvent?.id}/photos?photoId=${photo.id}`,
        {
            method: "DELETE",
        }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
        throw new Error(
            data.error || "Failed to delete photo"
        );
        }

        setEventPhotos((current) =>
        current.filter(
            (item) => item.id !== photo.id
        )
        );

        setSelectedEvent((current) =>
        current
            ? {
                ...current,
                totalPhotos: data.totalPhotos,
            }
            : current
        );
    } catch (error) {
        console.error(error);

        alert(
        error instanceof Error
            ? error.message
            : "Failed to delete photo"
        );
    }
    }

  async function deleteEvent(
    event: PhotoSelectionEvent
  ) {
    const confirmed = window.confirm(
      `Delete "${event.eventName}"?\n\n` +
        `Event Code: ${event.eventCode}\n` +
        `Client: ${event.clientName}\n` +
        `Photos: ${event.totalPhotos}\n\n` +
        `This will permanently delete the event, ` +
        `all selection photos, File Manager records, ` +
        `Cloudinary images, selections and submissions.\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/photo-selection/events/${event.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to delete event"
        );
      }

      // Remove event from the current list
      setEvents((current) =>
        current.filter(
          (item) => item.id !== event.id
        )
      );

      // Close manage modal if this event is open
      if (selectedEvent?.id === event.id) {
        setShowManageModal(false);
        setSelectedEvent(null);
        setEventPhotos([]);
      }

      alert(
        `Event "${event.eventName}" deleted successfully.`
      );
    } catch (error) {
      console.error(
        "[Photo Selection] Delete event failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete event"
      );
    }
  }

  async function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    if (!selectedEvent) {
      alert("Select an event first");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const total = files.length;

      for (let index = 0; index < total; index++) {
        const file = files[index];

        setUploadStatus(
          `Uploading ${index + 1} of ${total}: ${file.name}`
        );

        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch(
          `/api/photo-selection/events/${selectedEvent.id}/photos`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              `Failed to upload ${file.name}`
          );
        }

        const progress = Math.round(
          ((index + 1) / total) * 100
        );

        setUploadProgress(progress);
      }

      setUploadStatus(
        `${total} photo${
          total > 1 ? "s" : ""
        } uploaded successfully`
      );

      await loadEvents();

      setSelectedEvent((current) =>
        current
          ? {
              ...current,
              totalPhotos:
                current.totalPhotos + total,
            }
          : current
      );
    } catch (error) {
      console.error(error);

      setUploadStatus(
        error instanceof Error
          ? error.message
          : "Upload failed"
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-2xl font-semibold">
            Photo Selection
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Create events and manage client photo selections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Create Event
        </button>
      </div>

      {/* HIDDEN FILE INPUT */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {/* LOADING */}

      {loading && (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Loading events...
        </div>
      )}

      {/* EMPTY */}

      {!loading && events.length === 0 && (
        <div className="rounded-xl border p-10 text-center">

          <h3 className="text-lg font-medium">
            No Photo Selection Events
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Create your first event to start collecting
            client photo selections.
          </p>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Create First Event
          </button>

        </div>
      )}

      {/* EVENTS */}

      {!loading && events.length > 0 && (
        <div className="grid gap-4">

          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border p-5"
            >

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h3 className="text-lg font-semibold">
                    {event.eventName}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Client: {event.clientName}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">

                    <span className="rounded-md border px-2 py-1">
                      Code: {event.eventCode}
                    </span>

                    <span className="rounded-md border px-2 py-1">
                      {event.totalPhotos} Photos
                    </span>

                    <span className="rounded-md border px-2 py-1">
                      Limit: {event.selectionLimit}
                    </span>

                    <span className="rounded-md border px-2 py-1 capitalize">
                      {event.status}
                    </span>

                  </div>

                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openUpload(event)}
                    disabled={
                      uploading ||
                      event.status === "closed"
                    }
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Upload Photos
                  </button>

                  <button
                    type="button"
                    onClick={() => openManageEvent(event)}
                    className="rounded-lg border px-4 py-2 text-sm font-medium"
                  >
                    Manage Event
                  </button>

                  {event.status === "submitted" && (
                    <button
                      type="button"
                      onClick={() => openSelection(event)}
                      className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500 transition hover:bg-green-500/20"
                    >
                      View Selection
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteEvent(event)}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/20"
                  >
                    Delete Event
                  </button>
                </div>

              </div>

              {/* UPLOAD STATUS */}

              {selectedEvent?.id === event.id &&
                (uploading || uploadStatus) && (
                  <div className="mt-5 rounded-lg border p-4">

                    <div className="flex items-center justify-between text-sm">

                      <span>
                        {uploadStatus}
                      </span>

                      <span className="font-medium">
                        {uploadProgress}%
                      </span>

                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">

                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${uploadProgress}%`,
                        }}
                      />

                    </div>

                  </div>
                )}

            </div>
          ))}

        </div>
      )}

      {/* CREATE EVENT MODAL */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4">

          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>
                <h3 className="text-xl font-semibold">
                  Create Photo Selection Event
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create an event before uploading client photos.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                className="rounded-md px-2 py-1 text-lg text-muted-foreground hover:bg-muted"
              >
                ×
              </button>

            </div>

            <div className="mt-6 space-y-4">

              {/* EVENT NAME */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Event Name
                </label>

                <input
                  value={eventName}
                  onChange={(e) =>
                    setEventName(e.target.value)
                  }
                  placeholder="Jeevana Wedding"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* EVENT CODE */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Event Code
                </label>

                <input
                  value={eventCode}
                  onChange={(e) =>
                    setEventCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/\s/g, "")
                    )
                  }
                  placeholder="JEEVANA2026"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-primary"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Client will use this code to access their photos.
                </p>
              </div>

              {/* CLIENT */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Client Name
                </label>

                <input
                  value={clientName}
                  onChange={(e) =>
                    setClientName(e.target.value)
                  }
                  placeholder="Jeevana"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* LIMIT */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Selection Limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={selectionLimit}
                  onChange={(e) =>
                    setSelectionLimit(e.target.value)
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Example: Client can select up to 250 photos.
                </p>
              </div>

            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                disabled={creating}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createEvent}
                disabled={creating}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create Event"}
              </button>

            </div>

          </div>

        </div>
      )}

    {/* CLIENT SELECTION MODAL */}

    {showSelectionModal && selectedEvent && (
      <div className="fixed inset-0 z-50 bg-black/60 p-4">
        <div className="mx-auto my-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl">

          {/* HEADER */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                Client Selection
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {selectedEvent.eventName} •{" "}
                {selectedEvent.clientName}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSelectionModal(false)}
              className="rounded-md px-2 py-1 text-lg text-muted-foreground hover:bg-muted"
            >
              ×
            </button>
          </div>

          {/* SUMMARY */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Selected Photos
              </p>

              <p className="mt-1 text-2xl font-semibold text-green-500">
                {selectedPhotos.length}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Rejected Photos
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {rejectedPhotos.length}
              </p>
            </div>
          </div>

          {/* LOADING */}
          {loadingSelection && (
            <div className="mt-6 rounded-xl border p-8 text-center text-sm text-muted-foreground">
              Loading client selection...
            </div>
          )}

          {/* SELECTED PHOTOS */}
          {!loadingSelection && (
            <div className="mt-6">

              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold">
                    Selected Photos
                  </h4>

                  <p className="text-xs text-muted-foreground">
                    Exact original filenames selected by the client.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={selectedPhotos.length === 0}
                  onClick={() => {
                    const filenames =
                      selectedPhotos
                        .map(
                          (photo, index) =>
                            `${index + 1}. ${photo.originalFilename}`
                        )
                        .join("\n");

                    navigator.clipboard.writeText(
                      filenames
                    );

                    alert(
                      "Selected filenames copied to clipboard."
                    );
                  }}
                  className="rounded-lg border px-4 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  COPY ALL FILENAMES
                </button>
              </div>

              {selectedPhotos.length === 0 ? (
                <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
                  No selected photos found.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedPhotos.map(
                    (photo, index) => (
                      <div
                        key={photo.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <span className="w-8 shrink-0 text-xs font-semibold text-muted-foreground">
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        {photo.thumbnailUrl ? (
                          <img
                            src={photo.thumbnailUrl}
                            alt={photo.originalFilename}
                            className="h-12 w-12 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-[10px]">
                            No Image
                          </div>
                        )}

                        <p
                          className="min-w-0 flex-1 break-all text-sm font-medium"
                          title={photo.originalFilename}
                        >
                          {photo.originalFilename}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* REJECTED PHOTOS */}
          {!loadingSelection &&
            rejectedPhotos.length > 0 && (
              <div className="mt-8">

                <h4 className="text-sm font-semibold">
                  Rejected Photos
                </h4>

                <p className="mb-3 text-xs text-muted-foreground">
                  Photos the client rejected.
                </p>

                <div className="space-y-2">
                  {rejectedPhotos.map(
                    (photo, index) => (
                      <div
                        key={photo.id}
                        className="flex items-center gap-3 rounded-lg border p-3 opacity-70"
                      >
                        <span className="w-8 shrink-0 text-xs font-semibold text-muted-foreground">
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        {photo.thumbnailUrl ? (
                          <img
                            src={photo.thumbnailUrl}
                            alt={photo.originalFilename}
                            className="h-12 w-12 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-[10px]">
                            No Image
                          </div>
                        )}

                        <p
                          className="min-w-0 flex-1 break-all text-sm"
                          title={photo.originalFilename}
                        >
                          {photo.originalFilename}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* CLOSE */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() =>
                setShowSelectionModal(false)
              }
              className="rounded-lg border px-5 py-2.5 text-sm font-medium"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    )}

    {/* MANAGE EVENT MODAL */}

    {showManageModal && selectedEvent && (
    <div className="fixed inset-0 z-50 bg-black/60 p-4">

        <div className="mx-auto my-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl">

        <div className="flex items-start justify-between">

            <div>
            <h3 className="text-xl font-semibold">
                Manage Event
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
                {selectedEvent.eventName}
            </p>
            </div>

            <button
            type="button"
            onClick={() => setShowManageModal(false)}
            className="rounded-md px-2 py-1 text-lg text-muted-foreground hover:bg-muted"
            >
            ×
            </button>

        </div>

        {/* EVENT DETAILS */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
                Event Name
            </p>

            <p className="mt-1 font-medium">
                {selectedEvent.eventName}
            </p>
            </div>

            <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
                Client
            </p>

            <p className="mt-1 font-medium">
                {selectedEvent.clientName}
            </p>
            </div>

            <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
                Event Code
            </p>

            <p className="mt-1 font-medium">
                {selectedEvent.eventCode}
            </p>
            </div>

            <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
                Selection Limit
            </p>

            <p className="mt-1 font-medium">
                {selectedEvent.selectionLimit}
            </p>
            </div>

            <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
                Total Photos
            </p>

            <p className="mt-1 font-medium">
                {selectedEvent.totalPhotos}
            </p>
            </div>

            <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
                Status
            </p>

            <p className="mt-1 font-medium capitalize">
                {selectedEvent.status}
            </p>
            </div>

        </div>

        {/* UPLOADED PHOTOS */}

        <div className="mt-6">

        <div className="mb-3 flex items-center justify-between">

            <div>
            <h4 className="text-sm font-semibold">
                Uploaded Photos
            </h4>

            <p className="text-xs text-muted-foreground">
                {eventPhotos.length} photos
            </p>
            </div>

        </div>

        {loadingPhotos && (
            <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
            Loading photos...
            </div>
        )}

        {!loadingPhotos && eventPhotos.length === 0 && (
            <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
            No photos uploaded yet.
            </div>
        )}

        {!loadingPhotos && eventPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

            {eventPhotos.map((photo) => (
                <div
                key={photo.id}
                className="overflow-hidden rounded-xl border bg-muted"
                >

                <div className="aspect-square overflow-hidden">

                    {photo.thumbnailUrl ? (
                    <img
                        src={photo.thumbnailUrl}
                        alt={photo.originalFilename}
                        className="h-full w-full object-cover"
                    />
                    ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No Preview
                    </div>
                    )}

                </div>

                <div className="p-2">

                    <p
                    className="truncate text-xs font-medium"
                    title={photo.originalFilename}
                    >
                    {photo.originalFilename}
                    </p>

                    <button
                        type="button"
                        onClick={() => deletePhoto(photo)}
                        disabled={uploading}
                        className="mt-2 w-full rounded-md border border-red-500/30 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                    >
                        Delete
                    </button>

                </div>

                </div>
            ))}

            </div>
        )}

        </div>

        {/* ACTIONS */}

        <div className="mt-6 flex flex-wrap gap-3">

            <button
            type="button"
            onClick={() => {
                setShowManageModal(false);
                openUpload(selectedEvent);
            }}
            disabled={
                selectedEvent.status === "closed"
            }
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
            + Upload Photos
            </button>

            <button
            type="button"
            onClick={() => {
                setShowManageModal(false);
            }}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium"
            >
            Close
            </button>

        </div>

        </div>

    </div>
    )}

    </div>
  );
}