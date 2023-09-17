import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { kv } from "@vercel/kv";
import yaml from "js-yaml";

const SHARED_SONG_BUCKET = "shared-songs";
const ANALYTICS_MEASUREMENT_ID = "G-6NHHHN6N8M";
const PLATFORM_BUCKETS = {
  mac: "replay-updates-mac-arm64",
  mac_x64: "replay-updates-mac-x64",
  windows: "replay-updates-windows",
  linux: "replay-updates-linux",
};

export interface SharedSong {
  originalFilePath: string;
  dateStarted: string;
  modelId: string;
  modelName: string;
  songPath: string;
  displayName?: string;
}

export enum PlatformType {
  mac = "mac",
  windows = "windows",
  mac_x64 = "mac_x64",
  linux = "linux",
}

export const getExistingShareId = async (songId: string) => {
  // Check if we already have a mapping from SongID -> ShareID
  const data = (await kv.get(`song:${songId}`)) as string;
  return data;
};

const shortUUID = () => {
  return Math.random().toString(36).substring(2, 7);
};

export const getPlaybackUrl = async (shareId: string) => {
  if (!shareId || shareId.length < 5) {
    return null;
  }

  const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.PROXY_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.PROXY_R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.PROXY_R2_SECRET_ACCESS_KEY || "",
    },
  });

  // Generate presigned URL for playback
  const signedUrl = await getSignedUrl(
    S3,
    new GetObjectCommand({ Bucket: SHARED_SONG_BUCKET, Key: `${shareId}.mp3` }),
    {
      expiresIn: 3600,
    },
  );

  return signedUrl;
};

export const getUploadUrl = async (songId: string) => {
  const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.PROXY_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.PROXY_R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.PROXY_R2_SECRET_ACCESS_KEY || "",
    },
  });
  // Check we don't already have a mapping for this song
  const existingShareId = (await kv.get(`song:${songId}`)) as string;

  if (existingShareId) {
    return { signedUrl: "", shareId: existingShareId };
  }
  //   Generate UUID for this share
  let shareId = shortUUID();
  //   Check this uuid doesn't already exist in KVStore
  let existingSong = await kv.hgetall(`share:${shareId}`);
  while (existingSong) {
    shareId = shortUUID();
    existingSong = await kv.hgetall(`share:${shareId}`);
  }
  // Generate presigned URL for upload
  const signedUrl = await getSignedUrl(
    S3,
    new PutObjectCommand({ Bucket: SHARED_SONG_BUCKET, Key: `${shareId}.mp3` }),
    {
      expiresIn: 3600,
    },
  );
  // Store mapping from SongID -> ShareID
  await kv.set(`song:${songId}`, shareId);
  return { signedUrl, shareId };
};

export const flushUploadedSong = async (shareId: string, metadata: SharedSong) => {
  const status = await kv.set(`share:${shareId}`, metadata);
  return status;
};

export const getSharedSongDetails = async (shareId: string): Promise<SharedSong | undefined> => {
  const data = (await kv.get(`share:${shareId}`)) as SharedSong | undefined;
  return data;
};

const fetchYaml = async (url: string) => {
  const response = await fetch(url);
  const text = await response.text();
  const obj: Record<string, unknown> = yaml.load(text) as Record<string, unknown>;
  return obj;
};

export const getDownloadPath = async (platform: PlatformType) => {
  if (!platform || !platform.length || !PLATFORM_BUCKETS[platform]) {
    return null;
  }

  const updateBucket = PLATFORM_BUCKETS[platform];

  // Create access to the latest.yml file
  const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.PROXY_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.PROXY_R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.PROXY_R2_SECRET_ACCESS_KEY || "",
    },
  });

  const latestAccessUrl = await getSignedUrl(
    S3,
    new GetObjectCommand({ Bucket: updateBucket, Key: platform.startsWith("mac") ? "latest-mac.yml" : `latest.yml` }),
    {
      expiresIn: 3600,
    },
  );
  const yamlData = await fetchYaml(latestAccessUrl);
  if (yamlData.path) {
    // Now get the signed URL for the actual download
    const latestDownloadUrl = await getSignedUrl(
      S3,
      new GetObjectCommand({ Bucket: updateBucket, Key: yamlData.path as string }),
      {
        expiresIn: 3600,
      },
    );
    return latestDownloadUrl;
  } else {
    return null;
  }
};

export const logAnalytics = async ({
  deviceId,
  event,
  metadata = {},
}: {
  deviceId: string;
  event: string;
  metadata?: unknown;
}) => {
  // Define the url
  const url = `https://www.google-analytics.com/mp/collect?api_secret=${process.env.GOOGLE_ANALYTICS_API_SECRET}&measurement_id=${ANALYTICS_MEASUREMENT_ID}`;

  // Define the body of the post request
  const body = {
    client_id: deviceId,
    events: [
      {
        name: event,
        params: metadata,
      },
    ],
  };

  try {
    // Make the POST request
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // If the status code is not 2xx, throw an error
    if (!response.ok) {
      throw new Error(`Error: received a status code of ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error(`Failed to log analytics: ${error}`);
  }
};
