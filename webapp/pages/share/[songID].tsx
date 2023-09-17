import React from "react";
import { Golos_Text } from "next/font/google";
import Head from "next/head";
import Image from "next/image";
import Waveform from "@/components/Waveform";
import { startCase } from "lodash-es";
import path from "path-browserify";
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { kv } from "@vercel/kv";
import type { SharedSong } from "../../server/kv_utils";

const golosText = Golos_Text({ subsets: ["latin"] });
const MEDIA_BASE_URL = "https://tracks.replay-music.xyz";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { songID } = context.query;
  const songData = (await kv.get(`share:${songID}`)) as SharedSong | undefined;
  return {
    props: {
      songID,
      songData,
    },
  };
};

export default function SharedSong({ songID, songData }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  let backupDisplayName = "";
  if (songData) {
    backupDisplayName = path.parse(songData.songPath || songData.originalFilePath).name;
  }

  return (
    <>
      <Head>
        <title>
          {songData
            ? `${startCase(songData.modelName)} - ${songData?.displayName || startCase(backupDisplayName)}`
            : "Check out this AI Remixed Song"}
        </title>
        <meta
          property="og:image"
          content={`https://tryreplay.io/api/og?title=${
            songData?.displayName || startCase(backupDisplayName) || ""
          }&artist=${startCase(songData?.modelName || songData?.modelId) || ""}`}
        />
        <meta property="og:audio" content={`${MEDIA_BASE_URL}/${songID}.mp3`} />
      </Head>
      <div>
        <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center p-[3em] md:p-[10em] bg-[#1B3A4B]">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-cover opacity-60"
            style={{
              backgroundImage: `url('/squiggle.png')`,
            }}
          />
          <main
            className={`flex flex-col items-center justify-center text-center text-white ${golosText.className} z-10`}
          >
            {/* Logo */}
            <h1 className="absolute top-2 md:top-4 left-8 md:left-12 text-[3em] md:text-[5em] font-[700] tracking-[-.08em]">
              Replay
            </h1>
            {/* Discord */}
            <a href="https://discord.gg/A5rgNwDRd4" target="_blank" rel="noreferrer">
              <div className="hidden lg:flex flex-row gap-2 items-center absolute top-12 right-12 text-xl bg-white text-black p-4 rounded-md transform transition-transform duration-250 ease-in-out hover:scale-105">
                Join our Discord
                <img src="/discord-black.png" className="w-8 h-6 inline-block ml-2" alt="Discord" />
              </div>
            </a>

            {/* Intel Mac */}
            <a
              href="/download?platform=mac_x64"
              className="hidden md:block absolute bottom-12 left-12 text-2xl transform transition-transform duration-250 ease-in-out hover:scale-105"
            >
              Download for Intel Macs
            </a>
            {/* Mac */}
            <a
              href="/download?platform=mac"
              className="hidden md:block absolute bottom-12 text-2xl transform transition-transform duration-250 ease-in-out hover:scale-105"
            >
              Download for Apple Silicon
            </a>
            {/* Windows */}
            <a
              href="/download?platform=windows"
              className="hidden md:block absolute bottom-12 right-12 text-2xl transform transition-transform duration-250 ease-in-out hover:scale-105"
            >
              Download for Windows
            </a>
            {/* Mobile Discord */}
            <div className="flex md:hidden flex-row gap-2 items-center absolute bottom-12 ml-auto mr-auto text-sm bg-white text-black p-4 rounded-md transform transition-transform duration-250 ease-in-out hover:scale-105">
              <a href="https://discord.gg/A5rgNwDRd4" target="_blank" rel="noreferrer">
                Join our Discord
              </a>
              <img src="/discord-black.png" className="w-8 h-6 inline-block ml-2" alt="Discord" />
            </div>
            {/* Shared song details */}
            <div className="flex flex-col items-center justify-center text-center bg-white z-10 rounded-lg p-2 md:p-4 text-black">
              {songData ? (
                <div className="flex flex-col items-start bg-white z-10 rounded-lg p-4 text-black gap-4">
                  <div className="flex items-center">
                    <div className="hidden md:block relative h-20 w-20 rounded-lg overflow-hidden">
                      <Image src="/favicon-192.png" alt="Image description" layout="fill" objectFit="cover" />
                    </div>
                    <div className="flex flex-col items-start justify-center md:ml-4 gap-1">
                      <h1 className="text-xl md:text-2xl font-bold text-left">
                        {songData.displayName || startCase(backupDisplayName)}
                      </h1>
                      {/* large and very bold */}
                      <h2 className="text-black text-sm md:text-md">
                        <span className="hidden md:inline">Remixed as: </span>
                        <span className="bg-[#eee] px-3 py-1 rounded-full font-semibold">
                          {startCase(songData.modelName || songData.modelId)}
                        </span>
                      </h2>
                      {/* slightly bolder */}
                      <h3 className="text-xs md:text-sm text-gray-400">{songData.dateStarted.split(" ")[0]}</h3>{" "}
                      {/* small, light grey text */}
                    </div>
                  </div>
                  <Waveform shareId={songID} />
                </div>
              ) : (
                "No song found"
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
