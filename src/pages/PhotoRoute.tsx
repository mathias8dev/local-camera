import { useParams } from "react-router-dom";
import { PhotoPage } from "@/presentation/components/gallery/PhotoPage";

export function PhotoRoute() {
  const { id } = useParams<{ id: string }>();
  return <PhotoPage photoId={id!} />;
}
