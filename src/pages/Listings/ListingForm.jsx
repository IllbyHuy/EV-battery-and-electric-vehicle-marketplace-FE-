import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { createListing } from "../../api/ListingApi"; // Import the API function

export default function ListingForm() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createListing({ title, price, description });
      // Reset form fields after successful submission
      setTitle("");
      setPrice("");
      setDescription("");
    } catch (err) {
      setError(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Input
        placeholder="Price"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Listing"}
      </Button>
    </form>
  );
}