import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  author?: string;
}

export const SEO = ({
  title,
  description,
  keywords = "CollabRoom,collabe room, coding platform, collaborative code, realtime editor, developers, share code, programming, easy copy paste,coderoom, collabroom, devroom, collavroom, collab room",
  image = "/meta_logo.png",
  url = "https://www.CollabRoom.online",
  author = "CollabRoom Team",
}: SEOProps) => {
  return (
    <Helmet>
      <title>{title} | CollabRoom</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="CollabRoom" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@CollabRoom" />
    </Helmet>
  );
};
