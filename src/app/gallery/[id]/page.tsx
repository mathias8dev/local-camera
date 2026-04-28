import { PhotoPage } from "@/presentation/components/gallery/PhotoPage";

export default async function PhotoRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PhotoPage photoId={id} />;
}
