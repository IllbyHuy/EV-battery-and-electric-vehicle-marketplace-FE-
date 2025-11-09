import React from "react";
import { useParams } from "react-router-dom";
import { getListingDetails } from "../../api/ListingApi"; // Function to fetch listing details
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export default function ListingDetails() {
  const { id } = useParams(); // Get the listing ID from the URL parameters
  const [listing, setListing] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await getListingDetails(id); // Fetch listing details from API
        setListing(data);
      } catch (err) {
        setError(err.message || "Failed to load listing details");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{listing.title}</CardTitle>
        <Badge>{listing.type}</Badge>
      </CardHeader>
      <CardContent>
        <p>Price: {listing.price}</p>
        <p>Description: {listing.description}</p>
        <p>Specifications: {listing.spec}</p>
      </CardContent>
    </Card>
  );
}