"use client";
import ReviewInterface from "../../components/ReviewInterface";

export default function ReviewPage() {
  return (
    <ReviewInterface 
      title="Review" 
      description="Pending design uploads and threaded feedback." 
      isDesignerOnly={false} 
    />
  );
}
