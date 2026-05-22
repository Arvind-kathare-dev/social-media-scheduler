"use client";
import ReviewInterface from "../../components/ReviewInterface";

export default function MyUploadsPage() {
  return (
    <ReviewInterface 
      title="My Uploads" 
      description="Track feedback on your submitted designs." 
      isDesignerOnly={true} 
    />
  );
}
