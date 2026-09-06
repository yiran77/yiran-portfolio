import Portfolio from '@/components/portfolio';
import catalog from './media-catalog.json';

const DEFAULT_MEDIA_BASE_URL = 'https://pub-32146805d38d4e4c8130abf9a4c7ae79.r2.dev';

function resolveMediaUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || DEFAULT_MEDIA_BASE_URL).replace(/\/$/, '');
  const objectPath = path.replace(/^\/media\//, '/').replace(/\.m4v$/i, '.mp4');
  return `${baseUrl}${objectPath}`;
}

export default function Home() {
  const videos = catalog.videos.map((video) => ({
    ...video,
    preview: resolveMediaUrl(video.preview),
    full: resolveMediaUrl(video.full),
    poster: resolveMediaUrl(video.poster),
  }));
  const images = catalog.images.map((image) => ({
    ...image,
    src: resolveMediaUrl(image.src),
  }));

  return <Portfolio videos={videos} images={images} />;
}
