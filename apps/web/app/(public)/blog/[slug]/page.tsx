import { redirect } from "next/navigation";
import { blogPostPublicPath } from "@/lib/public-paths";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Legacy /blog/:slug URLs → /:slug */
export default async function LegacyBlogPostRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(blogPostPublicPath(slug));
}
