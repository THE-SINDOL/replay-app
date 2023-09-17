import React from "react";
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { getDownloadPath, type PlatformType } from "@/server/kv_utils";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { platform } = context.query;
  const downloadPath = await getDownloadPath(platform as PlatformType);

  return {
    props: {
      downloadPath,
    },
    redirect: {
      destination: downloadPath || "/",
      permanent: false,
    },
  };
};

export default function Download({ downloadPath }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <div>Taking you to download...</div>
      <div>
        <a href={downloadPath}>Click here</a> if you are not taken there automatically.
      </div>
    </>
  );
}
